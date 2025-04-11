<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Single_Chat {

    private $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'phoenix_history';

        add_action('admin_menu', [$this, 'add_submenu_page']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function add_submenu_page() {
        add_submenu_page(
            null,
            'Chat Session',
            'Chat Session',
            'manage_options',
            'phoenix-chat-session',
            [$this, 'render_chat_session']
        );
    }

    public function enqueue_assets($hook) {
        if ($hook !== 'phoenix-admin-chat_page_phoenix-chat-session') return;

        wp_enqueue_style('phoenix-admin-style', PHOENIX_CHATBOT_URL . 'assets/css/admin-chat.css', [], '1.0');
        wp_enqueue_script('phoenix-admin-chat-live', PHOENIX_CHATBOT_URL . 'assets/js/admin-chat-live.js', ['jquery'], '1.0', true);

        wp_localize_script('phoenix-admin-chat-live', 'PhoenixChatLiveData', [
            'ajaxurl'     => admin_url('admin-ajax.php'),
            'session_id'  => isset($_GET['session_id']) ? sanitize_text_field($_GET['session_id']) : '',
            'admin_name'  => wp_get_current_user()->display_name,
            'nonce'       => wp_create_nonce('phoenix_admin_chat_live')
        ]);
    }

    public function render_chat_session() {
        if ( ! isset($_GET['session_id']) ) {
            echo '<div class="wrap"><h1>Chat not found</h1></div>';
            return;
        }

        $session_id = sanitize_text_field($_GET['session_id']);
        echo '<div class="wrap">';
        echo '<h1>Chat Session: ' . esc_html($session_id) . '</h1>';
        echo '<div id="phoenix-admin-chat-live-box" class="chatbox-admin"></div>';
        echo '<div class="phoenix-chat-input-container" style="margin-top:10px;">';
        echo '<input type="text" id="phoenix-admin-chat-input" placeholder="Escribe un mensaje...">';
        echo '<button id="phoenix-admin-send-btn" class="button button-primary">Enviar</button>';
        echo '</div>';
        echo '</div>';
    }
}
