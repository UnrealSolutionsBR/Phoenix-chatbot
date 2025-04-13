<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Chat {

    private $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'phoenix_history';

        add_action('wp_ajax_phoenix_bulk_delete', [$this, 'handle_bulk_delete']);
    }

    public function get_chat_stats() {
        global $wpdb;

        $all     = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table}");
        $active  = $wpdb->get_var("SELECT COUNT(*) FROM (
            SELECT session_id
            FROM {$this->table}
            GROUP BY session_id
            HAVING SUM(CASE WHEN sender = 'admin' THEN 1 ELSE 0 END) = 0
        ) AS active_chats");

        $trash = 0; // Si implementas papelera, actualiza este valor desde otra tabla o campo 'status'

        return compact('all', 'active', 'trash');
    }

    public function get_chats($paged = 1, $per_page = 10) {
        global $wpdb;
        $offset = ($paged - 1) * $per_page;

        $results = $wpdb->get_results("
            SELECT session_id,
                   MIN(created_at) AS created_at,
                   MAX(created_at) AS last_message,
                   COUNT(*) AS total_messages,
                   MAX(CASE WHEN sender = 'admin' THEN message ELSE NULL END) AS managed_by
            FROM {$this->table}
            GROUP BY session_id
            ORDER BY last_message DESC
            LIMIT $per_page OFFSET $offset
        ");

        $total_items = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table}");

        return [
            'chats' => $results,
            'total' => $total_items
        ];
    }

    public function handle_bulk_delete() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }
    
        $session_ids = $_POST['session_ids'] ?? [];
        if (!is_array($session_ids)) $session_ids = [$session_ids];
    
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';
    
        foreach ($session_ids as $sid) {
            $wpdb->delete($table, ['session_id' => sanitize_text_field($sid)]);
        }
    
        wp_send_json_success(['deleted' => count($session_ids)]);
    }    

    public static function generate_numeric_id($session_id) {
        return substr(abs(crc32($session_id)), 0, 5);
    }

    public static function render_admin_name($message) {
        if (preg_match('/^(.*) entr[oó] al chat$/i', $message, $matches)) {
            return esc_html($matches[1]);
        }
        return 'Phoenix';
    }

    public function render_dashboard_html() {
        $paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
        $per_page = 10;
    
        $stats = $this->get_chat_stats();
        $data  = $this->get_chats($paged, $per_page);
        $total_pages = ceil($data['total'] / $per_page);
    
        ob_start(); ?>
    
        <h2>Chatbot history</h2>
        <p>
            All (<?= $stats['all'] ?>) | 
            Active (<?= $stats['active'] ?>) | 
            Trash (<?= $stats['trash'] ?>)
        </p>
    
        <table class="widefat fixed striped">
            <thead>
                <tr>
                    <th>Chat ID</th>
                    <th>Managed by</th>
                    <th>Created</th>
                    <th>Last message</th>
                    <th>Total messages</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($data['chats'] as $chat): ?>
                <tr>
                    <td><?= self::generate_numeric_id($chat->session_id) ?></td>
                    <td><?= self::render_admin_name($chat->managed_by) ?></td>
                    <td><?= date('Y-m-d H:i', strtotime($chat->created_at)) ?></td>
                    <td><?= date('Y-m-d H:i', strtotime($chat->last_message)) ?></td>
                    <td><?= $chat->total_messages ?></td>
                    <td>
                    <a class="phoenix-take-control" href="<?= esc_url(add_query_arg('phoenix_take_control', $chat->session_id, home_url())) ?>" target="_blank">Take control</a>
                        <button class="phoenix-delete-btn" data-session-id="<?= esc_attr($chat->session_id) ?>">Delete</button>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    
        <?php if ($total_pages > 1): ?>
            <div style="margin-top: 20px;">
                <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                    <a href="?paged=<?= $i ?>" style="margin-right: 10px;<?= ($i === $paged ? ' font-weight: bold;' : '') ?>">
                        Página <?= $i ?>
                    </a>
                <?php endfor; ?>
            </div>
        <?php endif; ?>
    
        <?php
        wp_enqueue_script(
            'phoenix-admin-dashboard-js',
            PHOENIX_CHATBOT_URL . 'assets/js/admin-dashboard.js',
            [],
            filemtime(PHOENIX_CHATBOT_PATH . 'assets/js/admin-dashboard.js'),
            true
        );
    
        wp_localize_script('phoenix-admin-dashboard-js', 'phoenixAdminDashboard', [
            'ajaxurl' => admin_url('admin-ajax.php'),
        ]);
    
        return ob_get_clean();
    }    
}
