<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_History {

    public function __construct() {
        add_action('wp_ajax_phoenix_save_message', [$this, 'save_message']);
        add_action('wp_ajax_nopriv_phoenix_save_message', [$this, 'save_message']);

        add_action('wp_ajax_phoenix_get_messages', [$this, 'get_messages']);
        add_action('wp_ajax_nopriv_phoenix_get_messages', [$this, 'get_messages']);

        add_action('wp_ajax_phoenix_send_admin_message', [$this, 'send_admin_message']);
    }

    /**
     * Guardar mensaje del bot o del usuario
     */
    public function save_message() {
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $sender     = sanitize_text_field($_POST['sender'] ?? '');
        $message    = sanitize_textarea_field($_POST['message'] ?? '');

        if (empty($session_id) || empty($sender) || empty($message)) {
            wp_send_json_error(['error' => 'Missing required fields']);
        }

        $wpdb->insert($table, [
            'session_id' => $session_id,
            'sender'     => $sender,
            'message'    => $message,
            'created_at' => current_time('mysql')
        ]);

        if ($wpdb->last_error) {
            wp_send_json_error(['error' => $wpdb->last_error]);
        }

        wp_send_json_success(['id' => $wpdb->insert_id]);
    }

    /**
     * Obtener historial de mensajes por sesión
     */
    public function get_messages() {
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_GET['session_id'] ?? '');
        $since      = isset($_GET['after']) ? intval($_GET['after']) : 0;

        if (empty($session_id)) {
            wp_send_json_error(['error' => 'Missing session_id']);
        }

        $query = $wpdb->prepare(
            "SELECT * FROM $table WHERE session_id = %s AND UNIX_TIMESTAMP(created_at) > %d ORDER BY created_at ASC",
            $session_id,
            $since
        );

        $results = $wpdb->get_results($query);

        wp_send_json_success($results);
    }

    /**
     * Enviar mensaje del admin (AJAX)
     */
    public function send_admin_message() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['error' => 'Unauthorized']);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $message    = sanitize_text_field($_POST['message'] ?? '');

        if (!$session_id || !$message) {
            wp_send_json_error(['error' => 'Faltan datos']);
        }

        $result = $wpdb->insert($table, [
            'session_id' => $session_id,
            'sender'     => 'admin',
            'message'    => $message,
            'created_at' => current_time('mysql')
        ]);

        if ($result === false) {
            wp_send_json_error(['error' => 'DB error']);
        }

        wp_send_json_success(['id' => $wpdb->insert_id]);
    }
}
