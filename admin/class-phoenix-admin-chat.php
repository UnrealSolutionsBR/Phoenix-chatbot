<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Chat {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
    }

    /**
     * Registrar la página del panel de administración
     */
    public function register_admin_menu() {
        add_menu_page(
            'Phoenix Chat Monitor',
            'Chat Monitor',
            'manage_options',
            'phoenix-chat-monitor',
            [ $this, 'render_admin_chat_page' ],
            'dashicons-format-chat',
            25
        );
    }

    /**
     * Cargar scripts JS/CSS si estamos en la página correcta
     */
    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'toplevel_page_phoenix-chat-monitor' ) return;

        wp_enqueue_style( 'phoenix-admin-style', PHOENIX_CHATBOT_URL . 'assets/css/admin-chat.css', [], '1.0' );
        wp_enqueue_script( 'phoenix-admin-chat', PHOENIX_CHATBOT_URL . 'assets/js/admin-chat.js', [ 'jquery' ], '1.0', true );

        wp_localize_script( 'phoenix-admin-chat', 'PhoenixChatMonitorData', [
            'ajaxurl'    => admin_url( 'admin-ajax.php' ),
            'ws_url'     => 'ws://localhost:8080', // actualizar si tu WebSocket va en otro host o puerto
            'nonce'      => wp_create_nonce( 'phoenix_admin_chat' )
        ]);
    }

    /**
     * Renderiza la interfaz HTML del panel admin
     */
    public function render_admin_chat_page() {
        echo '<div class="wrap">';
        echo '<h1>Monitor de Chat en Vivo</h1>';
        echo '<div id="phoenix-admin-chat-app">';
        echo '<p>Cargando chats activos...</p>';
        echo '</div>';
        echo '</div>';
    }
}
