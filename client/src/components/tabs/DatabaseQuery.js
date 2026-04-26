// client/src/components/tabs/DatabaseQuery.js
import React, { useState, useEffect } from 'react';
import { testMySQLConnection, getMySQLTables, executeMySQLQuery } from '../../api';
import api from '../../api';

const DatabaseQuery = () => {
    const [connections, setConnections] = useState([]);
    const [expandedConnId, setExpandedConnId] = useState(null);
    const [expandedDb, setExpandedDb] = useState(null);
    const [error, setError] = useState('');
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
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
             // 获取当前登录用户的 ID
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = currentUser.id;

            const res = await getMySQLTables({ ...conn, database: dbName , connId: conn.id, userId: userId});
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

        // 第一次双击后自动查询一次，未生效
        // executeQuery(tabId);
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

    const updateTabSql = (tabId, sql) => {
        setOpenTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, sql } : tab));
    };

    const closeAllTabs = () => {
        setOpenTabs([]);
        setActiveTabId(null);
    };

    const executeQuery = async (tabId, newPage = null) => {
        const tab = openTabs.find(t => t.id === tabId);
        if (!tab) return;
        setLoading(true);
        const page = newPage !== null ? newPage : tab.page;
        try {
            const res = await executeMySQLQuery({
                ...tab.connConfig,
                database: tab.database,
                sql: tab.sql,
                page,
                pageSize: tab.pageSize,
            });
            if (res.data.success) {
                setOpenTabs(prev => prev.map(t => t.id === tabId ? {
                    ...t,
                    results: res.data.data,
                    fields: res.data.fields,
                    total: res.data.total,
                    page: res.data.page,
                    pageSize: res.data.pageSize,
                } : t));
            } else {
                alert('查询失败: ' + res.data.message);
            }
        } catch (err) {
            alert('查询异常: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const changePage = (tabId, direction) => {
        const tab = openTabs.find(t => t.id === tabId);
        if (!tab) return;
        const newPage = direction === 'prev' ? tab.page - 1 : tab.page + 1;
        if (newPage < 1) return;
        if (tab.total && newPage > Math.ceil(tab.total / tab.pageSize)) return;
        executeQuery(tabId, newPage);
    };

    return (
        <div className="tab-container database-query-container">
            <h2>MySQL 数据库查询</h2>
            <div className="database-explorer">
                <div className="db-sidebar">
                    <div className="sidebar-header">
                        <h4>数据库连接</h4>
                        {/* <button onClick={() => { setShowAddForm(true); setEditingConn(null); setConnectionForm({ host: 'localhost', port: 3306, user: 'root', password: '', name: '' }); }} className="add-conn-btn">+ 添加</button> */}
                    </div>
                    {/* {showAddForm && (
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
                    )} */}
                    <ul className="conn-list">
                        {connections.map(conn => (
                            <li key={conn.id}>
                                <div className="conn-item">
                                    <span className="conn-name" onClick={() => handleExpandConn(conn)}>
                                        {expandedConnId === conn.id ? '📂' : '📁'} {conn.name || `${conn.host}:${conn.port}`}
                                    </span>
                                    {/* <div className="conn-actions">
                                        <button onClick={() => editConnection(conn)}>✏️</button>
                                        <button onClick={() => deleteConnection(conn.id)}>🗑️</button>
                                    </div> */}
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
                                                            <li key={table} className="table-item" onDoubleClick={() => openTableTab(conn, db, table)}>
                                                                {/* 📄  */}
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

                <div className="query-tabs">
                    {openTabs.length === 0 ? (
                        <div className="no-tab">双击左侧表名打开查询标签页</div>
                    ) : (
                        <>
                            <div className="tab-bar">
                                {openTabs.map(tab => (
                                    <div
                                        key={tab.id}
                                        className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTabId(tab.id)}
                                        onDoubleClick={(e) => closeTab(tab.id, e)}
                                    >
                                        {tab.table}
                                        <span className="close-tab" onClick={(e) => closeTab(tab.id, e)}>×</span>
                                    </div>
                                ))}
                                {openTabs.length > 0 && (
                                    <button className="close-all-btn" onClick={closeAllTabs} title="关闭全部">
                                        × 全部
                                    </button>
                                )}
                            </div>
                            {openTabs.map(tab => (
                                activeTabId === tab.id && (
                                    <div key={tab.id} className="query-panel">
                                        <div className="sql-editor">
                                            <textarea
                                                value={tab.sql}
                                                onChange={(e) => updateTabSql(tab.id, e.target.value)}
                                                rows={8}
                                            />
                                            <button className="execute-btn" onClick={() => executeQuery(tab.id)}>执行</button>
                                        </div>
                                        <div className="results-table">
                                            {tab.results ? (
                                                <>
                                                    <div className="pagination">
                                                        <button onClick={() => changePage(tab.id, 'prev')} disabled={tab.page <= 1}>上一页</button>
                                                        <span>第 {tab.page} 页 / 共 {Math.ceil(tab.total / tab.pageSize)} 页 (总 {tab.total} 条)</span>
                                                        <button onClick={() => changePage(tab.id, 'next')} disabled={tab.page >= Math.ceil(tab.total / tab.pageSize)}>下一页</button>
                                                    </div>
                                                    <div className="table-wrapper">
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    {tab.fields && tab.fields.map(field => <th key={field}>{field}</th>)}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {tab.results.map((row, idx) => (
                                                                    <tr key={idx}>
                                                                        {tab.fields.map(field => <td key={field}>{String(row[field])}</td>)}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="no-data">点击“执行”按钮查询数据</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseQuery;