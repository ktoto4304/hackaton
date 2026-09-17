import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCatalog } from '@/store/catalog';
import type { Camera } from '@/features/drones/types';

export function CamerasPage() {
  const { cameras, addCamera, updateCamera, removeCamera } = useCatalog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [form] = Form.useForm<Camera>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (record: Camera) => {
    setEditing(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateCamera({ ...editing, ...values });
    } else {
      addCamera({ ...values, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'FOV (°)', dataIndex: 'fovDeg', key: 'fovDeg' },
    { title: 'Разрешение (Мп)', dataIndex: 'resolutionMp', key: 'resolutionMp' },
    { title: 'Фокусное (мм)', dataIndex: 'focalLengthMm', key: 'focalLengthMm' },
    { title: 'Перекрытие (%)', dataIndex: 'overlapPercent', key: 'overlapPercent' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Camera) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm
            title="Удалить камеру?"
            onConfirm={() => removeCamera(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Камеры</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить камеру
        </Button>
      </div>

      <Table rowKey="id" dataSource={cameras} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Редактировать камеру' : 'Новая камера'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input placeholder="Zenmuse H20T" />
          </Form.Item>
          <Form.Item name="fovDeg" label="Угол обзора FOV (°)" rules={[{ required: true }]}>
            <InputNumber min={1} max={360} className="w-full" />
          </Form.Item>
          <Form.Item name="resolutionMp" label="Разрешение (Мп)" rules={[{ required: true }]}>
            <InputNumber min={1} max={200} className="w-full" />
          </Form.Item>
          <Form.Item name="focalLengthMm" label="Фокусное расстояние (мм)" rules={[{ required: true }]}>
            <InputNumber min={1} max={2000} className="w-full" />
          </Form.Item>
          <Form.Item name="overlapPercent" label="Перекрытие (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={99} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}