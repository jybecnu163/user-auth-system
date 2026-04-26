import React from 'react';

const Sidebar = ({ tabs, activeTab, onTabChange, collapsed, onToggleCollapse }) => {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={onToggleCollapse}>
        {collapsed ? '☰' : '◀'}
      </div>
      <ul className="sidebar-menu">
        {tabs.map(tab => (
          <li
            key={tab.key}
            className={`sidebar-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            title={collapsed ? tab.label : ''}
          >
            <span className="sidebar-icon">{tab.icon}</span>
            {!collapsed && <span className="sidebar-label">{tab.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Sidebar;