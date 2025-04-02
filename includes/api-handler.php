<?php
// Seguridad básica
if (!defined('ABSPATH')) {
    exit;
}

// Endpoint AJAX para enviar mensaje a OpenAI desde el chatbot
add_action('wp_ajax_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');
add_action('wp_ajax_nopriv_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');

function phoenix_handle_chatbot_message() {
    // Validar existencia del historial
    if (!isset($_POST['history'])) {
        wp_send_json_error(['error' => 'No se recibió historial de conversación.']);
    }

    $api_key = get_option('phoenix_openai_api_key');

    if (!$api_key) {
        wp_send_json_error(['error' => 'API Key no configurada.']);
    }

    // Decodificar historial recibido desde el frontend
    $history = json_decode(stripslashes($_POST['history']), true);

    if (empty($history) || !is_array($history)) {
        wp_send_json_error(['error' => 'El historial no es válido.']);
    }

    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-3.5-turbo',
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
