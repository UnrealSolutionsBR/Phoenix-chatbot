<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_History {

    public function __construct() {
        add_action('wp_ajax_phoenix_save_message', [$this, 'save_message']);
        add_action('wp_ajax_nopriv_phoenix_save_message', [$this, 'save_message']);

        add_action('wp_ajax_phoenix_get_messages', [$this, 'get_messages']);
        add_action('wp_ajax_nopriv_phoenix_get_messages', [$this, 'get_messages']);

        add_action('wp_ajax_phoenix_get_sessions', [$this, 'get_sessions']); // ✅ NUEVO
    }

    // 📝 Guardar mensaje
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

    // 📦 Obtener mensajes por sesión
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

    // 📋 Obtener todas las sesiones activas (para el admin)
    public function get_sessions() {
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $results = $wpdb->get_results("
            SELECT session_id, MAX(created_at) as last_message
            FROM $table
            GROUP BY session_id
            ORDER BY last_message DESC
        ");

        wp_send_json_success($results);
    }
}
