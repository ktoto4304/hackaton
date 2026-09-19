import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, notification } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCatalog } from '@/store/catalog';
import type { Drone, DroneType } from '@/features/drones/types';
import { droneSchema } from '@/features/drones/schema';

const TYPE_LABELS: Record<DroneType, string> = {
  quadcopter: 'Мультироторный',
  'fixed-wing': 'Самолётный',
  helicopter: 'Вертолётный',
  vtol: 'Конвертоплан',
};

export function DronesPage() {
  const { drones, addDrone, updateDrone, removeDrone } = useCatalog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Drone | null>(null);
  const [form] = Form.useForm<Drone>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (record: Drone) => {
    setEditing(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();

    const parsed = droneSchema.safeParse({
      ...values,
      id: editing?.id ?? crypto.randomUUID(),
    });
    if (!parsed.success) {
      notification.error({
        message: 'Некорректные данные',
        description: parsed.error.errors[0]?.message ?? 'Проверьте поля',
        placement: 'topRight',
      });
      return;
    }

    if (editing) updateDrone(parsed.data);
    else addDrone(parsed.data);

    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (t: DroneType) => TYPE_LABELS[t],
    },
    {
      title: 'Время полёта (мин)',
      dataIndex: 'maxFlightTimeMin',
      key: 'maxFlightTimeMin',
      sorter: (a: Drone, b: Drone) => a.maxFlightTimeMin - b.maxFlightTimeMin,
    },
    { title: 'Скорость (м/с)', dataIndex: 'cruiseSpeedMs', key: 'cruiseSpeedMs' },
    { title: 'Взлётный вес (г)', dataIndex: 'maxTakeoffWeightG', key: 'maxTakeoffWeightG' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Drone) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm
            title="Удалить БВС?"
            onConfirm={() => removeDrone(record.id)}
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
        <h1 className="text-2xl font-semibold">Парк БВС</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить БВС
        </Button>
      </div>

      <Table rowKey="id" dataSource={drones} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Редактировать БВС' : 'Новый БВС'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, max: 100 }]}>
            <Input placeholder="DJI Mavic 3 Enterprise" maxLength={100} />
          </Form.Item>
          <Form.Item name="type" label="Тип" rules={[{ required: true }]}>
            <Select
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="maxFlightTimeMin" label="Макс. время полёта (мин)" rules={[{ required: true }]}>
            <InputNumber min={1} max={2000} className="w-full" />
          </Form.Item>
          <Form.Item name="cruiseSpeedMs" label="Крейсерская скорость (м/с)" rules={[{ required: true }]}>
            <InputNumber min={1} max={200} className="w-full" />
          </Form.Item>
          <Form.Item name="maxTakeoffWeightG" label="Макс. взлётный вес (г)" rules={[{ required: true }]}>
            <InputNumber min={1} max={100000} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}