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

        $all = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table}");

        $active = $wpdb->get_var("SELECT COUNT(*) FROM (
            SELECT session_id
            FROM {$this->table}
            GROUP BY session_id
            HAVING SUM(CASE WHEN sender = 'admin' THEN 1 ELSE 0 END) = 0
        ) AS active_chats");

        $trash = 0; // No implementado aún

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

        $session_ids = (array) ($_POST['session_ids'] ?? []);
        global $wpdb;

        foreach ($session_ids as $sid) {
            $wpdb->delete($this->table, ['session_id' => sanitize_text_field($sid)]);
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
        <p class="phoenix-dashboard-stats">
            <span>All (<?= $stats['all'] ?>)</span>
            <span>Active (<?= $stats['active'] ?>)</span>
            <span>Trash (<?= $stats['trash'] ?>)</span>
        </p>

        <table class="widefat fixed striped phoenix-admin-table">
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
                        <a class="phoenix-take-control"
                           href="<?= esc_url(add_query_arg('phoenix_take_control', $chat->session_id, home_url())) ?>"
                           target="_blank">
                            Take control
                        </a>
                        <button class="phoenix-delete-btn"
                                data-session-id="<?= esc_attr($chat->session_id) ?>">
                            Delete
                        </button>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <?php if ($total_pages > 1): ?>
            <div class="phoenix-pagination">
                <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                    <a href="?paged=<?= $i ?>" class="<?= $i === $paged ? 'active' : '' ?>">
                        Página <?= $i ?>
                    </a>
                <?php endfor; ?>
            </div>
        <?php endif; ?>

        <!-- Toast visual de confirmación -->
        <div id="phoenix-toast" style="display:none;position:fixed;bottom:30px;right:30px;padding:12px 20px;background:#27ae60;color:#fff;border-radius:6px;font-weight:600;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.2); transition: opacity 0.3s ease;">
            Chat eliminado con éxito
        </div>

        <?php return ob_get_clean();
    }
}