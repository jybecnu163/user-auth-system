// client/src/components/tabs/PermissionManager.js
import React, { useState, useEffect } from 'react';
import api from '../../api';

const PermissionManager = () => {
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedConnId, setSelectedConnId] = useState(null);
  const [permissions, setPermissions] = useState({ databases: [] });
  const [availableTables, setAvailableTables] = useState({});
  const [loading, setLoading] = useState(false);

  // 加载用户列表和连接列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, connsRes] = await Promise.all([
          api.get('/api/permissions/users'),
          api.get('/api/permissions/connections')
        ]);
        setUsers(usersRes.data);
        setConnections(connsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // 当选择用户和连接时加载权限
  useEffect(() => {
    if (selectedUserId && selectedConnId) {
      loadPermissions();
    }
  }, [selectedUserId, selectedConnId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/permissions/${selectedUserId}/${selectedConnId}`);
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 获取某数据库的表列表（需要连接测试）
  const fetchTables = async (conn, dbName) => {
    if (availableTables[`${conn.id}|${dbName}`]) return;
    try {
      const res = await api.post('/api/mysql/tables', { ...conn, database: dbName });
      if (res.data.success) {
        setAvailableTables(prev => ({
          ...prev,
          [`${conn.id}|${dbName}`]: res.data.tables
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addDatabase = () => {
    setPermissions(prev => ({
      ...prev,
      databases: [...prev.databases, { db: '', tables: [] }]
    }));
  };

  const updateDatabaseName = (idx, dbName) => {
    const newDatabases = [...permissions.databases];
    newDatabases[idx].db = dbName;
    setPermissions({ ...permissions, databases: newDatabases });
    // 异步获取表
    const conn = connections.find(c => c.id === selectedConnId);
    if (conn && dbName) {
      fetchTables(conn, dbName);
    }
  };

  const toggleTable = (dbIdx, tableName, checked) => {
    const newDatabases = [...permissions.databases];
    if (checked) {
      newDatabases[dbIdx].tables.push(tableName);
    } else {
      newDatabases[dbIdx].tables = newDatabases[dbIdx].tables.filter(t => t !== tableName);
    }
    setPermissions({ ...permissions, databases: newDatabases });
  };

  const removeDatabase = (idx) => {
    const newDatabases = permissions.databases.filter((_, i) => i !== idx);
    setPermissions({ ...permissions, databases: newDatabases });
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      await api.post(`/api/permissions/${selectedUserId}/${selectedConnId}`, {
        databases: permissions.databases
      });
      alert('保存成功');
    } catch (err) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedConn = connections.find(c => c.id === selectedConnId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="tab-container permission-container">
      <h2>数据库和表权限管理</h2>
      <div className="permission-layout">
        <div className="user-list">
          <h4>系统人员</h4>
          <ul>
            {users.map(user => (
              <li
                key={user.id}
                className={selectedUserId === user.id ? 'active' : ''}
                onDoubleClick={() => setSelectedUserId(user.id)}
              >
                {user.username}
              </li>
            ))}
          </ul>
        </div>
        <div className="conn-list">
          <h4>MySQL地址</h4>
          <ul>
            {connections.map(conn => (
              <li
                key={conn.id}
                className={selectedConnId === conn.id ? 'active' : ''}
                onClick={() => setSelectedConnId(conn.id)}
              >
                {conn.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="permission-editor">
          {selectedUserId && selectedConnId ? (
            <>
              <h4>权限配置：{selectedUser?.username} @ {selectedConn?.name}</h4>
              {permissions.databases.map((dbPerm, idx) => (
                <div key={idx} className="db-permission">
                  <div className="db-header">
                    <input
                      type="text"
                      placeholder="数据库名"
                      value={dbPerm.db}
                      onChange={(e) => updateDatabaseName(idx, e.target.value)}
                    />
                    <button onClick={() => removeDatabase(idx)}>删除</button>
                  </div>
                  {dbPerm.db && (
                    <div className="tables-list">
                      {availableTables[`${selectedConnId}|${dbPerm.db}`]?.map(table => (
                        <label key={table}>
                          <input
                            type="checkbox"
                            checked={dbPerm.tables.includes(table)}
                            onChange={(e) => toggleTable(idx, table, e.target.checked)}
                          />
                          {table}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addDatabase} className="add-db-btn">+ 添加数据库</button>
              <button onClick={savePermissions} className="save-perm-btn" disabled={loading}>保存权限</button>
            </>
          ) : (
            <div className="hint">请双击左侧人员，然后点击右侧MySQL地址进行配置</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;