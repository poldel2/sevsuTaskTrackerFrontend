import React from "react";
import { Form, Input, Button } from "antd";

const TaskForm = ({ form, onFinish }) => {
    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="title" label="Название задачи" rules={[{ required: true, message: "Введите название!" }]}>
                <Input />
            </Form.Item>
            <Form.Item name="description" label="Описание">
                <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">Добавить</Button>
            </Form.Item>
        </Form>
    );
};

export default TaskForm;
