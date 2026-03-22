import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../hooks/useSocial';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, UserCheck, Eye, Building2, Check, X, RefreshCw, Search } from 'lucide-react';
import './SocialPage.css';

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default function SocialPage() {
  const { user } = useAuth();
  const {
    friends,
    followers,
    following,
    pendingRequests,
    profileViewers,
    loading,
    acceptFollowRequest,
    rejectFollowRequest,
    removeFollow,
    sendFollowRequest,
    refreshSocial,
  } = useSocial();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('friends');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);

  // Load pending outgoing requests
  useEffect(() => {
    const loadOutgoing = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('follows')
        .select('*, followed:profiles!follows_followed_id_fkey(user_id, display_name, avatar_url)')
        .eq('follower_id', user.id)
        .eq('status', 'pending');
      setPendingOutgoing(data || []);
    };
    loadOutgoing();
  }, [user, following]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSocial();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio')
        .ilike('display_name', `%${searchQuery.trim()}%`)
        .neq('user_id', user.id)
        .limit(20);
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetId, name) => {
    const success = await sendFollowRequest(targetId);
    if (success) {
      showMessage(`Follow request sent to ${name}! 📨`);
      // Refresh outgoing
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('follows')
        .select('*, followed:profiles!follows_followed_id_fkey(user_id, display_name, avatar_url)')
        .eq('follower_id', user.id)
        .eq('status', 'pending');
      setPendingOutgoing(data || []);
    } else {
      showMessage('Already following or request sent.');
    }
  };

  const handleAccept = async (followId, name) => {
    const success = await acceptFollowRequest(followId);
    if (success) showMessage(`Accepted ${name}'s request! 🤝`);
  };

  const handleReject = async (followId, name) => {
    const success = await rejectFollowRequest(followId);
    if (success) showMessage(`Rejected ${name}'s request.`);
  };

  const handleUnfollow = async (targetId, name) => {
    const success = await removeFollow(targetId);
    if (success) showMessage(`Unfollowed ${name}.`);
  };

  const isFollowing = (targetId) =>
    following.some(f => f.followed_id === targetId);

  const isPendingTo = (targetId) =>
    pendingOutgoing.some(f => f.followed_id === targetId);

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'followers', label: 'Followers', icon: UserCheck, count: followers.length + pendingRequests.length },
    { id: 'following', label: 'Following', icon: UserPlus, count: following.length },
    { id: 'views', label: 'Viewed Me', icon: Eye, count: profileViewers.length },
  ];

  return (
    <div className="social-page">
      <div className="social-header">
        <div className="social-title-row">
          <Users size={32} className="social-icon" />
          <h1>Social</h1>
        </div>
        <button
          className={`btn btn-sm btn-secondary refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {message && <div className="social-toast glass-sm">{message}</div>}

      {/* Search Bar */}
      <div className="social-search glass-sm">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search mayors by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          maxLength={40}
        />
        <button className="btn btn-sm btn-primary" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results glass">
          <h3>Search Results</h3>
          <div className="search-results-list">
            {searchResults.map(p => (
              <div key={p.user_id} className="social-card glass-sm">
                <div className="social-card-avatar" onClick={() => navigate(`/visit/${p.user_id}`)}>
                  {p.avatar_url?.length > 5 ? '👤' : (p.avatar_url || '🤖')}
                </div>
                <div className="social-card-info">
                  <span className="social-card-name">{p.display_name || 'Mayor'}</span>
                  {p.bio && <span className="social-card-bio">{p.bio}</span>}
                </div>
                <div className="social-card-actions">
                  {isFollowing(p.user_id) ? (
                    <button className="btn btn-sm btn-secondary" disabled>Following</button>
                  ) : isPendingTo(p.user_id) ? (
                    <button className="btn btn-sm btn-secondary" disabled>Pending</button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleFollow(p.user_id, p.display_name)}>
                      <UserPlus size={14} /> Follow
                    </button>
                  )}
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/visit/${p.user_id}`)}>
                    <Building2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setSearchResults([])}>
            Clear Results
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="social-tabs">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            className={`social-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {count > 0 && <span className="tab-count">{count}</span>}
            {id === 'followers' && pendingRequests.length > 0 && (
              <span className="tab-badge">{pendingRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="social-content">
        {loading ? (
          <div className="social-loading">
            <div className="loading-spinner" />
            <p>Loading social data...</p>
          </div>
        ) : (
          <>
            {/* FRIENDS TAB */}
            {activeTab === 'friends' && (
              <div className="social-list">
                {friends.length === 0 ? (
                  <div className="social-empty glass-sm">
                    <Users size={40} className="empty-icon" />
                    <h3>No friends yet</h3>
                    <p>Search for mayors above or follow people from the Leaderboard!</p>
                  </div>
                ) : (
                  friends.map(f => (
                    <div key={f.user_id} className="social-card glass-sm friend-card">
                      <div className="social-card-avatar" onClick={() => navigate(`/visit/${f.user_id}`)}>
                        {f.avatar_url?.length > 5 ? '👤' : (f.avatar_url || '🤖')}
                      </div>
                      <div className="social-card-info">
                        <span className="social-card-name">{f.display_name || 'Mayor'}</span>
                        {f.bio && <span className="social-card-bio">{f.bio}</span>}
                        <span className="friend-badge">🤝 Friends</span>
                      </div>
                      <div className="social-card-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/visit/${f.user_id}`)}>
                          <Building2 size={14} /> Visit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FOLLOWERS TAB */}
            {activeTab === 'followers' && (
              <div className="social-list">
                {pendingRequests.length > 0 && (
                  <div className="pending-section">
                    <h3 className="section-label">📨 Pending Requests</h3>
                    {pendingRequests.map(req => (
                      <div key={req.id} className="social-card glass-sm pending-card">
                        <div className="social-card-avatar">
                          {req.follower?.avatar_url?.length > 5 ? '👤' : (req.follower?.avatar_url || '🤖')}
                        </div>
                        <div className="social-card-info">
                          <span className="social-card-name">{req.follower?.display_name || 'Mayor'}</span>
                          <span className="social-card-time">wants to follow you</span>
                        </div>
                        <div className="social-card-actions">
                          <button className="btn btn-sm btn-primary accept-btn" onClick={() => handleAccept(req.id, req.follower?.display_name)}>
                            <Check size={14} /> Accept
                          </button>
                          <button className="btn btn-sm btn-danger reject-btn" onClick={() => handleReject(req.id, req.follower?.display_name)}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="section-label">👥 Followers ({followers.length})</h3>
                {followers.length === 0 ? (
                  <div className="social-empty glass-sm">
                    <UserCheck size={40} className="empty-icon" />
                    <p>No followers yet. Share your city to get noticed!</p>
                  </div>
                ) : (
                  followers.map(f => (
                    <div key={f.id} className="social-card glass-sm">
                      <div className="social-card-avatar" onClick={() => navigate(`/visit/${f.follower?.user_id}`)}>
                        {f.follower?.avatar_url?.length > 5 ? '👤' : (f.follower?.avatar_url || '🤖')}
                      </div>
                      <div className="social-card-info">
                        <span className="social-card-name">{f.follower?.display_name || 'Mayor'}</span>
                        {f.follower?.bio && <span className="social-card-bio">{f.follower.bio}</span>}
                      </div>
                      <div className="social-card-actions">
                        {!isFollowing(f.follower_id) && !isPendingTo(f.follower_id) && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleFollow(f.follower_id, f.follower?.display_name)}>
                            <UserPlus size={14} /> Follow Back
                          </button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/visit/${f.follower?.user_id}`)}>
                          <Building2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FOLLOWING TAB */}
            {activeTab === 'following' && (
              <div className="social-list">
                {/* Show pending outgoing */}
                {pendingOutgoing.length > 0 && (
                  <div className="pending-section">
                    <h3 className="section-label">⏳ Pending Requests</h3>
                    {pendingOutgoing.map(req => (
                      <div key={req.id} className="social-card glass-sm pending-outgoing-card">
                        <div className="social-card-avatar">
                          {req.followed?.avatar_url?.length > 5 ? '👤' : (req.followed?.avatar_url || '🤖')}
                        </div>
                        <div className="social-card-info">
                          <span className="social-card-name">{req.followed?.display_name || 'Mayor'}</span>
                          <span className="social-card-time">Pending acceptance</span>
                        </div>
                        <div className="social-card-actions">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleUnfollow(req.followed_id, req.followed?.display_name)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="section-label">Following ({following.length})</h3>
                {following.length === 0 && pendingOutgoing.length === 0 ? (
                  <div className="social-empty glass-sm">
                    <UserPlus size={40} className="empty-icon" />
                    <p>You're not following anyone. Discover mayors from the Leaderboard!</p>
                  </div>
                ) : (
                  following.map(f => (
                    <div key={f.id} className="social-card glass-sm">
                      <div className="social-card-avatar" onClick={() => navigate(`/visit/${f.followed?.user_id}`)}>
                        {f.followed?.avatar_url?.length > 5 ? '👤' : (f.followed?.avatar_url || '🤖')}
                      </div>
                      <div className="social-card-info">
                        <span className="social-card-name">{f.followed?.display_name || 'Mayor'}</span>
                        {f.followed?.bio && <span className="social-card-bio">{f.followed.bio}</span>}
                      </div>
                      <div className="social-card-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleUnfollow(f.followed_id, f.followed?.display_name)}>
                          Unfollow
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/visit/${f.followed?.user_id}`)}>
                          <Building2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* WHO VIEWED ME TAB */}
            {activeTab === 'views' && (
              <div className="social-list">
                <div className="views-header glass-sm">
                  <Eye size={20} />
                  <p>See who's been checking out your city! Mayors using <span className="gecko-text">🦎 Gecko Shield</span> stay invisible.</p>
                </div>
                {profileViewers.length === 0 ? (
                  <div className="social-empty glass-sm">
                    <Eye size={40} className="empty-icon" />
                    <h3>No views yet</h3>
                    <p>When someone visits your city, they'll appear here.</p>
                  </div>
                ) : (
                  profileViewers.map((v, i) => (
                    <div key={v.id || i} className="social-card glass-sm view-card">
                      <div className="social-card-avatar" onClick={() => navigate(`/visit/${v.viewer?.user_id}`)}>
                        {v.viewer?.avatar_url?.length > 5 ? '👤' : (v.viewer?.avatar_url || '🤖')}
                      </div>
                      <div className="social-card-info">
                        <span className="social-card-name">
                          {v.viewer?.display_name || 'Anonymous Mayor'}
                        </span>
                        <span className="social-card-time">viewed your profile {timeAgo(v.viewed_at)}</span>
                      </div>
                      <div className="social-card-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/visit/${v.viewer?.user_id}`)}>
                          <Building2 size={14} /> Visit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
