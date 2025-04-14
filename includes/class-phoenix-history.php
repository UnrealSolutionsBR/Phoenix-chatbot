<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_History {

    public function __construct() {
        add_action('wp_ajax_phoenix_save_message', [$this, 'save_message']);
        add_action('wp_ajax_nopriv_phoenix_save_message', [$this, 'save_message']);

        add_action('wp_ajax_phoenix_get_messages', [$this, 'get_messages']);
        add_action('wp_ajax_nopriv_phoenix_get_messages', [$this, 'get_messages']);

        add_action('wp_ajax_phoenix_get_sessions', [$this, 'get_sessions']); // ✅ En caso de que se use más adelante
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

    // 📦 Obtener mensajes por sesión (basado en ID, no timestamp)
    public function get_messages() {
        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_GET['session_id'] ?? '');
        $since_id   = isset($_GET['after']) ? intval($_GET['after']) : 0;

        if (empty($session_id)) {
            wp_send_json_error(['error' => 'Missing session_id']);
        }

        $query = $wpdb->prepare(
            "SELECT * FROM $table WHERE session_id = %s AND id > %d ORDER BY id ASC",
            $session_id,
            $since_id
        );

        $results = $wpdb->get_results($query);

        wp_send_json_success($results);
    }

    // 🧪 (Futuro) Obtener sesiones activas — aún no implementado
    public function get_sessions() {
        wp_send_json_success([]); // Placeholder
    }
}
