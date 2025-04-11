<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Chat {

    private $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'phoenix_history';

        add_action('admin_menu', [$this, 'register_admin_page']);
        add_action('admin_post_phoenix_bulk_delete', [$this, 'handle_bulk_delete']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    public function register_admin_page() {
        add_menu_page(
            'Phoenix Chat Monitor',
            'Chat Monitor',
            'manage_options',
            'phoenix-admin-chat',
            [$this, 'render_admin_page'],
            'dashicons-format-chat',
            25
        );
    }

    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_phoenix-admin-chat') return;

        wp_enqueue_style('phoenix-admin-style', PHOENIX_CHATBOT_URL . 'assets/css/admin-chat.css', [], '1.1');
        wp_enqueue_script('phoenix-admin-chat', PHOENIX_CHATBOT_URL . 'assets/js/admin-chat.js', ['jquery'], '1.1', true);

        wp_localize_script('phoenix-admin-chat', 'PhoenixChatMonitorData', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('phoenix_admin_chat')
        ]);
    }

    public function render_admin_page() {
        global $wpdb;

        $per_page = 20;
        $paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
        $offset = ($paged - 1) * $per_page;

        $all_count = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table}");
        $active_count = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table} WHERE status = 'active'");
        $trash_count = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM {$this->table} WHERE status = 'trash'");

        $sessions = $wpdb->get_results($wpdb->prepare("
            SELECT 
                MIN(id) as first_id,
                session_id,
                MIN(created_at) as created,
                MAX(created_at) as last_message,
                COUNT(*) as total_messages,
                MAX(managed_by) as managed_by
            FROM {$this->table}
            WHERE status = 'active'
            GROUP BY session_id
            ORDER BY last_message DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset));

        echo '<div class="wrap">';
        echo '<h1>Chatbot history</h1>';
        echo '<p>All (' . intval($all_count) . ') | Active (' . intval($active_count) . ') | Trash (' . intval($trash_count) . ')</p>';
        echo '<form method="POST" action="' . admin_url('admin-post.php') . '">';
        echo '<input type="hidden" name="action" value="phoenix_bulk_delete">';
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>';
        echo '<th scope="col" class="manage-column column-cb check-column"><input type="checkbox" id="select-all"></th>';
        echo '<th>Chat ID</th><th>Managed by</th><th>Created</th><th>Last message</th><th>Total messages</th><th>Actions</th>';
        echo '</tr></thead><tbody>';

        foreach ($sessions as $session) {
            $chat_id = substr(preg_replace('/[^0-9]/', '', md5($session->session_id)), 0, 5);
            $managed_by = $session->managed_by ?: 'Phoenix';

            echo '<tr>';
            echo '<th class="check-column"><input type="checkbox" name="session_ids[]" value="' . esc_attr($session->session_id) . '"></th>';
            echo '<td><a href="#">' . esc_html($chat_id) . '</a></td>';
            echo '<td>' . esc_html($managed_by) . '</td>';
            echo '<td>' . date_i18n('d M Y H:i', strtotime($session->created)) . '</td>';
            echo '<td>' . date_i18n('d M Y H:i', strtotime($session->last_message)) . '</td>';
            echo '<td>' . intval($session->total_messages) . '</td>';
            echo '<td>
                <a href="#" class="button button-primary">Take control</a>
                <button type="submit" name="session_ids[]" value="' . esc_attr($session->session_id) . '" class="button button-secondary" style="color:red;">Delete</button>
            </td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
        echo '<div style="margin-top: 10px;"><input type="submit" class="button" value="Apply"></div>';
        echo '</form>';

        $total_pages = ceil($all_count / $per_page);
        if ($total_pages > 1) {
            echo '<div class="tablenav"><div class="tablenav-pages">';
            echo paginate_links([
                'base' => add_query_arg('paged', '%#%'),
                'format' => '',
                'prev_text' => '&laquo;',
                'next_text' => '&raquo;',
                'total' => $total_pages,
                'current' => $paged
            ]);
            echo '</div></div>';
        }

        echo '</div>';

        echo "<script>
            document.getElementById('select-all').addEventListener('click', function(e) {
                const checkboxes = document.querySelectorAll('input[name=\"session_ids[]\"]');
                for (let box of checkboxes) box.checked = e.target.checked;
            });
        </script>";
    }

    public function handle_bulk_delete() {
        if ( ! current_user_can('manage_options') || ! isset($_POST['session_ids']) ) {
            wp_die('Access denied');
        }

        global $wpdb;
        $session_ids = array_map('sanitize_text_field', $_POST['session_ids']);

        foreach ($session_ids as $session_id) {
            $wpdb->update($this->table, ['status' => 'trash'], ['session_id' => $session_id]);
        }

        wp_redirect(admin_url('admin.php?page=phoenix-admin-chat&deleted=1'));
        exit;
    }
}