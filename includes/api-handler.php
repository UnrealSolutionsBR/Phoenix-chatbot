<?php
// Seguridad básica
if (!defined('ABSPATH')) {
    exit;
}

// Endpoint AJAX para enviar mensaje a OpenAI desde el chatbot
add_action('wp_ajax_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');
add_action('wp_ajax_nopriv_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');

function phoenix_handle_chatbot_message() {
    // Validar historial recibido
    if (!isset($_POST['history'])) {
        wp_send_json_error(['error' => 'No se recibió historial de conversación.']);
    }

    $api_key = get_option('phoenix_openai_api_key');
    if (!$api_key) {
        wp_send_json_error(['error' => 'API Key no configurada.']);
    }

    $history = json_decode(stripslashes($_POST['history']), true);
    if (empty($history) || !is_array($history)) {
        wp_send_json_error(['error' => 'El historial no es válido.']);
    }

    // Cargar JSON con mensajes predefinidos
    $json_path = plugin_dir_path(__FILE__) . 'chatflow-config.json';
    if (!file_exists($json_path)) {
        wp_send_json_error(['error' => 'Archivo de flujo de conversación no encontrado.']);
    }

    $chatflow = json_decode(file_get_contents($json_path), true);
    if (!$chatflow) {
        wp_send_json_error(['error' => 'No se pudo interpretar el flujo de conversación.']);
    }

    // Extra: detección básica de nombre para personalizar mensajes
    $user_name = null;
    foreach ($history as $message) {
        if ($message['role'] === 'user' && stripos($message['content'], 'me llamo ') !== false) {
            $user_name = trim(str_ireplace('me llamo', '', $message['content']));
        }
    }

    // Reemplazar {name} en los mensajes del flujo si se detectó un nombre
    if ($user_name && isset($chatflow['final_closure']['messages'])) {
        foreach ($chatflow['final_closure']['messages'] as &$msg) {
            $msg = str_replace('{name}', $user_name, $msg);
        }
    }

    // Opcional: puedes inyectar uno de estos mensajes si estás en un punto específico
    // $history[] = ['role' => 'assistant', 'content' => $chatflow['collect_user_data'][0]];

    // Preparar petición a OpenAI
    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-4o',
        'messages' => $history,
        'temperature' => 0.7,
        'max_tokens' => 500,
    ];

    $response = wp_remote_post($endpoint, [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => json_encode($request_body),
        'timeout' => 20,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['error' => 'Error al conectar con OpenAI.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $reply = $body['choices'][0]['message']['content'] ?? 'Lo siento, no pude generar una respuesta.';

    wp_send_json_success(['reply' => $reply]);
}
