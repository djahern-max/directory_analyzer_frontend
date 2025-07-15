function UserHeader({ user, onLogout }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f9f9f9'
        }}>
            <div>
                <span style={{ fontWeight: '500' }}>{user.name}</span>
                <span style={{
                    marginLeft: '1rem',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    Credits: ${user.credits_remaining?.toFixed(2) || '0.00'}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                    onClick={() => alert('Usage dashboard coming soon!')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Usage
                </button>

                <button
                    onClick={onLogout}
                    style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#666',
                        cursor: 'pointer'
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default UserHeader;