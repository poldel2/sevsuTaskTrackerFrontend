import React, { useState, useEffect } from 'react';
import { Modal, Spin, Table } from 'antd';
import { getActivities } from 'api/activities';

const ActivitiesModal = ({ projectId, filters, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await getActivities(projectId, filters);
        setActivities(data.items || data);
        setTotal(data.total || data.length);
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchActivities();
    }
  }, [visible, projectId, filters]);

  return (
    <Modal visible={visible} onCancel={onClose} footer={null}>
      <Spin spinning={loading}>
        <Table dataSource={activities} pagination={{ total }} />
      </Spin>
    </Modal>
  );
};

export default ActivitiesModal;