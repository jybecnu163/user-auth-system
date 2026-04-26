// client/src/components/tabs/PermissionManager.js
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { testMySQLConnection, getMySQLTables, executeMySQLQuery } from '../../api';

const PermissionManager = () => {
    const [users, setUsers] = useState([]);
    const [connections, setConnections] = useState([]);
    const [dbTree, setDbTree] = useState({});

    const [bindings, setBindings] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [expandedConnId, setExpandedConnId] = useState(null);
    const [expandedDbKey, setExpandedDbKey] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [expandedDb, setExpandedDb] = useState(null);
    const [error, setError] = useState('');
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingConn, setEditingConn] = useState(null);
    const [connectionForm, setConnectionForm] = useState({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        name: ''
    });
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchBindings();
        fetchConnections();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/permissions/users');
            if (res.data?.length) {
                setUsers(res.data);
                setSelectedUserId(res.data[0].id);
            }
        } catch (err) {
            console.error('获取用户失败', err);
        }
    };

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            const res = await api.get('/api/db-connections');
            setConnections(res.data);
        } catch (err) {
            console.error('加载连接失败', err);
        }
    };

    const testAndSaveConnection = async () => {
        setLoading(true);
        setError('');
        try {
            const testRes = await testMySQLConnection(connectionForm);
            if (testRes.data.success) {
                const saveRes = await api.post('/api/db-connections', {
                    id: editingConn?.id,
                    ...connectionForm,
                    name: connectionForm.name || `${connectionForm.host}:${connectionForm.port}`
                });
                await loadConnections();
                setShowAddForm(false);
                setEditingConn(null);
                setConnectionForm({ host: 'localhost', port: 3306, user: 'root', password: '', name: '' });
                setExpandedConnId(saveRes.data.id);
            } else {
                setError(testRes.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteConnection = async (connId) => {
        if (!window.confirm('确定删除此连接吗？')) return;
        try {
            await api.delete(`/api/db-connections/${connId}`);
            await loadConnections();
            if (expandedConnId === connId) {
                setExpandedConnId(null);
                setExpandedDb(null);
                setTables([]);
            }
        } catch (err) {
            alert('删除失败');
        }
    };

    const editConnection = (conn) => {
        setEditingConn(conn);
        setConnectionForm({
            host: conn.host,
            port: conn.port,
            user: conn.user,
            password: conn.password,
            name: conn.name
        });
        setShowAddForm(true);
    };

    const handleExpandConn = async (conn) => {
        if (expandedConnId === conn.id) {
            setExpandedConnId(null);
            setExpandedDb(null);
            setTables([]);
            return;
        }
        setLoading(true);
        try {
            const res = await testMySQLConnection(conn);
            if (res.data.success) {
                setExpandedConnId(conn.id);
                setConnections(prev => prev.map(c =>
                    c.id === conn.id ? { ...c, databases: res.data.databases } : c
                ));
                setExpandedDb(null);
                setTables([]);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExpandDb = async (conn, dbName) => {
        const dbKey = `${conn.id}|${dbName}`;
        if (expandedDb === dbKey) {
            setExpandedDb(null);
            setTables([]);
            return;
        }
        setLoading(true);
        try {
            const res = await getMySQLTables({ ...conn, database: dbName });
            if (res.data.success) {
                setTables(res.data.tables);
                setExpandedDb(dbKey);
                setConnections(prev => prev.map(c =>
                    c.id === conn.id ? { ...c, tablesCache: { ...c.tablesCache, [dbName]: res.data.tables } } : c
                ));
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const openTableTab = (conn, database, table) => {
        const tabId = `${conn.id}|${database}|${table}`;
        const existing = openTabs.find(t => t.id === tabId);
        if (existing) {
            setActiveTabId(tabId);
            return;
        }
        const newTab = {
            id: tabId,
            connId: conn.id,
            connConfig: { host: conn.host, port: conn.port, user: conn.user, password: conn.password },
            database,
            table,
            sql: `SELECT * FROM \`${table}\` LIMIT 10`,
            results: null,
            total: 0,
            page: 1,
            pageSize: 10,
        };
        setOpenTabs([...openTabs, newTab]);
        setActiveTabId(tabId);
    };

    const closeTab = (tabId, e) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(t => t.id !== tabId);
        setOpenTabs(newTabs);
        if (activeTabId === tabId && newTabs.length > 0) {
            setActiveTabId(newTabs[0].id);
        } else if (newTabs.length === 0) {
            setActiveTabId(null);
        }
    };

    const fetchBindings = async () => {
        try {
            const res = await api.get('/api/user-table-permissions');
            setBindings(res.data);
        } catch (err) {
            console.error('获取绑定失败', err);
        }
    };

    const fetchConnections = async () => {
        try {
            const res = await api.get('/api/db-connections');
            setConnections(res.data);
            res.data.forEach(conn => fetchDatabasesForConn(conn));
        } catch (err) {
            console.error('获取连接失败', err);
        }
    };

    const addConnection = async () => {
        const name = prompt('连接名称'); if (!name) return;
        const host = prompt('主机'); if (!host) return;
        const port = parseInt(prompt('端口', '3306')) || 3306;
        const user = prompt('用户名'); if (!user) return;
        const password = prompt('密码', '');
        try {
            const testRes = await api.post('/api/mysql/connect', { host, port, user, password });
            if (testRes.data.success) {
                const saveRes = await api.post('/api/db-connections', { name, host, port, user, password });
                setConnections(prev => [...prev, saveRes.data]);
                fetchDatabasesForConn(saveRes.data);
            } else {
                alert('连接失败：' + testRes.data.message);
            }
        } catch (err) {
            alert('连接失败');
        }
    };

    const fetchDatabasesForConn = async (conn) => {
        try {
            const res = await api.post('/api/mysql/connect', conn);
            if (res.data.success) {
                setDbTree(prev => ({
                    ...prev,
                    [conn.id]: { databases: res.data.databases, tables: {} }
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleConn = async (connId) => {
        if (expandedConnId === connId) {
            setExpandedConnId(null);
        } else {
            setExpandedConnId(connId);
            if (!dbTree[connId]) {
                const conn = connections.find(c => c.id === connId);
                if (conn) await fetchDatabasesForConn(conn);
            }
        }
    };

    const toggleDb = async (connId, dbName) => {
        const key = `${connId}|${dbName}`;
        if (expandedDbKey === key) {
            setExpandedDbKey(null);
        } else {
            setExpandedDbKey(key);
            if (!dbTree[connId]?.tables?.[dbName]) {
                const conn = connections.find(c => c.id === connId);
                if (conn) {
                    try {
                        const res = await api.post('/api/mysql/tables', { ...conn, database: dbName });
                        if (res.data.success) {
                            setDbTree(prev => ({
                                ...prev,
                                [connId]: {
                                    ...prev[connId],
                                    tables: { ...prev[connId]?.tables, [dbName]: res.data.tables }
                                }
                            }));
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }
    };

    const bindTable = (connId, database, table) => {
        if (!selectedUserId) {
            alert('请选择用户');
            return;
        }
        const exists = bindings.some(
            b => b.userId === selectedUserId && b.connId === connId && b.database === database && b.table === table
        );
        if (exists) {
            alert('该权限已存在');
            return;
        }
        setBindings([...bindings, { userId: selectedUserId, connId, database, table }]);
    };

    const removeBinding = (binding) => {
        if (window.confirm('删除此权限？')) {
            setBindings(bindings.filter(b => b !== binding));
        }
    };

    const saveBindings = async () => {
        const toSave = bindings.map(b => ({
            userId: b.userId,
            connId: b.connId,
            database: b.database,
            table: b.table
        }));
        try {
            await api.post('/api/user-table-permissions', { permissions: toSave });
            alert('保存成功');
        } catch (err) {
            alert('保存失败');
        }
    };

    const currentUserBindings = bindings.filter(b => b.userId === selectedUserId);
    const selectedUserName = users.find(u => u.id === selectedUserId)?.username || '';

    return (
        <div className="tab-container permission-container">
            <h2>用户表权限管理</h2>
            <div className="permission-layout">
                <div>
                    <div className="user-selector">
                        <span>系统人员：</span>
                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                    <div className="db-sidebar">
                        <div className="sidebar-header">
                            <h4>数据库连接</h4>
                            <button onClick={() => { setShowAddForm(true); setEditingConn(null); setConnectionForm({ host: 'localhost', port: 3306, user: 'root', password: '', name: '' }); }} className="add-conn-btn">+ 添加</button>
                        </div>
                        {showAddForm && (
                            <div className="conn-form">
                                <input type="text" placeholder="连接名称(可选)" value={connectionForm.name} onChange={e => setConnectionForm({ ...connectionForm, name: e.target.value })} />
                                <input type="text" placeholder="主机" value={connectionForm.host} onChange={e => setConnectionForm({ ...connectionForm, host: e.target.value })} />
                                <input type="number" placeholder="端口" value={connectionForm.port} onChange={e => setConnectionForm({ ...connectionForm, port: parseInt(e.target.value) })} />
                                <input type="text" placeholder="用户名" value={connectionForm.user} onChange={e => setConnectionForm({ ...connectionForm, user: e.target.value })} />
                                <input type="password" placeholder="密码" value={connectionForm.password} onChange={e => setConnectionForm({ ...connectionForm, password: e.target.value })} />
                                <div className="form-buttons">
                                    <button onClick={testAndSaveConnection} disabled={loading}>测试并保存</button>
                                    <button onClick={() => { setShowAddForm(false); setEditingConn(null); }}>取消</button>
                                </div>
                                {error && <div className="error-message">{error}</div>}
                            </div>
                        )}
                        <ul className="conn-list">
                            {connections.map(conn => (
                                <li key={conn.id}>
                                    <div className="conn-item">
                                        <span className="conn-name" onClick={() => handleExpandConn(conn)}>
                                            {expandedConnId === conn.id ? '📂' : '📁'} {conn.name || `${conn.host}:${conn.port}`}
                                        </span>
                                        <div className="conn-actions">
                                            <button onClick={() => editConnection(conn)}>✏️</button>
                                            <button onClick={() => deleteConnection(conn.id)}>🗑️</button>
                                        </div>
                                    </div>
                                    {expandedConnId === conn.id && conn.databases && (
                                        <ul className="db-list">
                                            {conn.databases.map(db => (
                                                <li key={db}>
                                                    <div className="db-item" onClick={() => handleExpandDb(conn, db)}>
                                                        <span>{expandedDb === `${conn.id}|${db}` ? '-' : '+'} {db}</span>
                                                    </div>
                                                    {expandedDb === `${conn.id}|${db}` && (
                                                        <ul className="table-list">
                                                            {(conn.tablesCache?.[db] || tables).map(table => (
                                                                <li key={table} className="table-item"
                                                                    onDoubleClick={() => bindTable(conn.id, db, table)}
                                                                >
                                                                    {table}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>


                {/* <div className="db-sidebar">
          <div className="sidebar-header">
            <div className="user-selector">
              <span>系统人员：</span>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            <button onClick={addConnection} className="add-conn-btn">+ 添加连接</button>
          </div>
          <div className="conn-list">
            {connections.map(conn => (
              <div key={conn.id} className="conn-item">
                <div className="conn-name" onClick={() => toggleConn(conn.id)}>
                  {expandedConnId === conn.id ? '📂' : '📁'} {conn.name}
                </div>
                {expandedConnId === conn.id && dbTree[conn.id] && (
                  <div className="db-list">
                    {dbTree[conn.id].databases?.map(db => (
                      <div key={db} className="db-item">
                        <div className="db-name" onClick={() => toggleDb(conn.id, db)}>
                          {expandedDbKey === `${conn.id}|${db}` ? '📂' : '📁'} {db}
                        </div>
                        {expandedDbKey === `${conn.id}|${db}` && dbTree[conn.id].tables?.[db] && (
                          <div className="table-list">
                            {dbTree[conn.id].tables[db].map(table => (
                              <div
                                key={table}
                                className="table-name"
                                onDoubleClick={() => bindTable(conn.id, db, table)}
                              >
                                📄 {table}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div> */}
                <div className="binding-list">
                    <h4>{selectedUserName} 的权限（双击删除）</h4>
                    <ul>
                        {currentUserBindings.map((b, idx) => {
                            const conn = connections.find(c => c.id === b.connId);
                            const display = `${conn?.name || b.connId}.${b.database}.${b.table}`;
                            return <li key={idx} onDoubleClick={() => removeBinding(b)}>{display}</li>;
                        })}
                        {!currentUserBindings.length && <li>暂无权限，双击左侧表名添加</li>}
                    </ul>
                    <button className="save-btn" onClick={saveBindings}>保存所有权限</button>
                </div>
            </div>
        </div>
    );
};

export default PermissionManager;