import React from 'react';
import { LeftOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';

const viewLabels = {
  month: 'Месяц',
  week: 'Неделя',
  day: 'День'
};

const CustomToolbar = (props) => {
  const { label, onNavigate, onView, view } = props;

  const viewItems = {
    items: props.views.map(viewName => ({
      key: viewName,
      label: viewLabels[viewName] || viewName,
      onClick: () => onView(viewName)
    }))
  };

  return (
    <div className="rbc-toolbar custom-toolbar">
      <div className="rbc-btn-group toolbar-navigation">
        <button type="button" onClick={() => onNavigate('TODAY')}>
            Сегодня
        </button>
        <button type="button" onClick={() => onNavigate('PREV')}>
            <LeftOutlined />
        </button>
        <button type="button" onClick={() => onNavigate('NEXT')}>
            <RightOutlined />
        </button>
      </div>

      <div className="rbc-toolbar-label">
        {label}
      </div>

      <div className="view-selector">
        <Dropdown menu={viewItems} trigger={['click']}>
          <button className="view-dropdown-button">
            {viewLabels[view] || view}
            <DownOutlined />
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default CustomToolbar;