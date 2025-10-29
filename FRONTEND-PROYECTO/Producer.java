package co.vinni;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeoutException;

public class Producer {
    private final static String QUEUE_NAME = "topic_sms";
    private final static String server = "127.0.0.1";
    public static void sendMsg(String message) throws IOException, TimeoutException {
        /*ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(server);
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);

            channel.basicPublish("", QUEUE_NAME, null, message.getBytes(StandardCharsets.UTF_8));
            System.out.println(" [x] Sent '" + message + "'");
        }*/
        sendMsg(message, QUEUE_NAME, null);
    }
    public static void sendMsg(String message, String queueNameP, String virtualHost ) throws IOException, TimeoutException {
        System.out.println("message "+message+ " queueNameP " + queueNameP+" virtualHost "+virtualHost);
        ConnectionFactory factory = new ConnectionFactory();
        boolean isVirtual = false;

        factory.setHost(server);
        if (virtualHost != null) {
            factory.setVirtualHost(virtualHost);
            isVirtual = true;
        }

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.queueDeclare(queueNameP, isVirtual, false, false, null);
            channel.basicPublish("", queueNameP, null, message.getBytes(StandardCharsets.UTF_8));
            System.out.println(" [x] Sent '" + message + "'");
        }
    }
    public static void sendMsgTopic(String message, String virtualHost, String exchangeName, String topic) throws IOException, TimeoutException {
        ConnectionFactory factory = new ConnectionFactory();


        factory.setHost(server);
        if (virtualHost != null) {
            factory.setVirtualHost(virtualHost);
        }

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

             channel.exchangeDeclare(exchangeName, "topic", true);

            channel.basicPublish(exchangeName, topic, null, message.getBytes(StandardCharsets.UTF_8));

            System.out.println(" [x] Sent '" + message + "'");
        }
    }
    public static void sendMsgFanout(String message, String virtualHost, String exchangeName) throws IOException, TimeoutException {
        ConnectionFactory factory = new ConnectionFactory();


        factory.setHost(server);
        if (virtualHost != null) {
            factory.setVirtualHost(virtualHost);
        }

        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

             channel.exchangeDeclare(exchangeName, "fanout", true);

            channel.basicPublish(exchangeName, "", null, message.getBytes(StandardCharsets.UTF_8));

            System.out.println(" [x] Sent '" + message + "'");
        }
    }

}
