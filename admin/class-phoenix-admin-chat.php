<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Admin_Chat {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
    }

    public function register_admin_menu() {
        add_menu_page(
            'Phoenix Chat Dashboard',
            'Chat Monitor',
            'manage_options',
            'phoenix-admin-chat',
            [ $this, 'redirect_to_dashboard' ],
            'dashicons-format-chat',
            25
        );
    }

    public function redirect_to_dashboard() {
        // Redirige al frontend dashboard
        wp_redirect( home_url( '/phoenix-dashboard/' ) );
        exit;
    }
}
