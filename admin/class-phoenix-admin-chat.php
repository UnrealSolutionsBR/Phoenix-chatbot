<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Chat {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
        add_action( 'admin_post_phoenix_bulk_delete', [ $this, 'handle_bulk_delete' ] );
    }

    public function register_admin_menu() {
        add_menu_page(
            'Phoenix Chat Monitor',
            'Chat Monitor',
            'manage_options',
            'phoenix-admin-chat',
            [ $this, 'render_admin_chat_page' ],
            'dashicons-format-chat',
            25
        );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'toplevel_page_phoenix-admin-chat' ) return;

        wp_enqueue_style( 'phoenix-admin-style', PHOENIX_CHATBOT_URL . 'assets/css/admin-chat.css', [], '1.0' );
        wp_enqueue_script( 'phoenix-admin-chat', PHOENIX_CHATBOT_URL . 'assets/js/admin-chat.js', [ 'jquery' ], '1.0', true );

        wp_localize_script( 'phoenix-admin-chat', 'PhoenixChatMonitorData', [
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'phoenix_admin_chat' )
        ]);
    }

    public function render_admin_chat_page() {
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $sessions = $wpdb->get_results("
            SELECT session_id, MAX(created_at) as last_message, COUNT(*) as total 
            FROM $table 
            GROUP BY session_id 
            ORDER BY last_message DESC
        ");

        echo '<div class="wrap"><h1>Monitor de Chat en Vivo</h1>';

        if ( isset($_GET['deleted']) ) {
            echo '<div class="notice notice-success is-dismissible"><p>Sesiones eliminadas correctamente.</p></div>';
        }

        echo '<form method="POST" action="' . admin_url('admin-post.php') . '">';
        echo '<input type="hidden" name="action" value="phoenix_bulk_delete">';
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>
                <td class="manage-column column-cb check-column"><input type="checkbox" id="select-all"></td>
                <th>Sesión</th><th>Último mensaje</th><th>Total mensajes</th>
              </tr></thead><tbody>';

        foreach ( $sessions as $session ) {
            echo '<tr>';
            echo '<th scope="row" class="check-column"><input type="checkbox" name="session_ids[]" value="' . esc_attr($session->session_id) . '"></th>';
            echo '<td><strong>' . esc_html($session->session_id) . '</strong></td>';
            echo '<td>' . date_i18n('d M Y H:i', strtotime($session->last_message)) . '</td>';
            echo '<td>' . esc_html($session->total) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
        echo '<p><input type="submit" class="button button-secondary" value="Eliminar historial seleccionado"></p>';
        echo '</form></div>';

        echo "<script>
            document.getElementById('select-all').addEventListener('click', function(e) {
                const checkboxes = document.querySelectorAll('input[name=\"session_ids[]\"]');
                for (let i = 0; i < checkboxes.length; i++) {
                    checkboxes[i].checked = e.target.checked;
                }
            });
        </script>";
    }

    public function handle_bulk_delete() {
        if ( ! current_user_can('manage_options') || ! isset($_POST['session_ids']) ) {
            wp_die('Acceso denegado');
        }

        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';
        $session_ids = array_map('sanitize_text_field', $_POST['session_ids']);

        foreach ( $session_ids as $session_id ) {
            $wpdb->delete($table, ['session_id' => $session_id]);
        }

        wp_redirect(admin_url('admin.php?page=phoenix-admin-chat&deleted=1'));
        exit;
    }
}
