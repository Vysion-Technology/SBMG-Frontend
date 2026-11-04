import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Award,
  Clock,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';

/**
 * Format relative time (e.g., "Just now", "5m ago", "2h ago", "Yesterday", "04 Nov")
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

/**
 * Helper to get icon, badge label, and color themes by category
 */
const getCategoryMeta = (category, priority) => {
  switch (category) {
    case 'NOTICE':
      return {
        icon: <FileText className="w-4 h-4 text-blue-600" />,
        label: 'Notice',
        badgeBg: '#eff6ff',
        badgeColor: '#1d4ed8',
        borderColor: '#3b82f6',
      };
    case 'NOTICE_REPLY':
      return {
        icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
        label: 'Reply',
        badgeBg: '#eef2ff',
        badgeColor: '#4338ca',
        borderColor: '#6366f1',
      };
    case 'SLA':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        label: 'SLA Escalation',
        badgeBg: '#fff1f2',
        badgeColor: '#be123c',
        borderColor: priority === 'CRITICAL' ? '#e11d48' : '#f59e0b',
      };
    case 'EVENT_START':
      return {
        icon: <Calendar className="w-4 h-4 text-emerald-600" />,
        label: 'Event Active',
        badgeBg: '#ecfdf5',
        badgeColor: '#047857',
        borderColor: '#10b981',
      };
    case 'EVENT_EXPIRE':
      return {
        icon: <Clock className="w-4 h-4 text-amber-600" />,
        label: 'Event Ending',
        badgeBg: '#fffbeb',
        badgeColor: '#b45309',
        borderColor: '#f59e0b',
      };
    case 'SCHEME_START':
      return {
        icon: <Award className="w-4 h-4 text-purple-600" />,
        label: 'New Scheme',
        badgeBg: '#faf5ff',
        badgeColor: '#7e22ce',
        borderColor: '#a855f7',
      };
    case 'SCHEME_EXPIRE':
      return {
        icon: <Clock className="w-4 h-4 text-orange-600" />,
        label: 'Scheme Closing',
        badgeBg: '#fff7ed',
        badgeColor: '#c2410c',
        borderColor: '#ea580c',
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-gray-600" />,
        label: 'System',
        badgeBg: '#f3f4f6',
        badgeColor: '#374151',
        borderColor: '#9ca3af',
      };
  }
};

const NotificationDropdown = ({ onNotificationsClick, onNavigateSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 1. Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response?.data?.unread_count !== undefined) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (err) {
      // Graceful fallback if not authenticated or error
      console.warn('Failed to fetch unread notification count:', err?.message || err);
    }
  }, []);

  // 2. Fetch notifications list
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getNotifications({
        page: 1,
        page_size: 30,
        unread_only: unreadOnly,
      });
      if (response?.data?.items) {
        setNotifications(response.data.items);
        if (response.data.unread_count !== undefined) {
          setUnreadCount(response.data.unread_count);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and 60-second periodic poll for badge
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When dropdown opens or filter toggles, load data
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(filterUnreadOnly);
    }
  }, [isOpen, filterUnreadOnly, fetchNotifications]);

  // Click outside listener to auto-close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationsAPI.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    setIsOpen(false);

    // Deep-link / routing logic
    const category = item.category || '';
    if (category === 'NOTICE' || category === 'NOTICE_REPLY') {
      if (typeof onNotificationsClick === 'function') {
        onNotificationsClick();
      } else if (typeof onNavigateSection === 'function') {
        onNavigateSection('notices');
      } else {
        navigate('/notices');
      }
    } else if (category === 'SLA') {
      if (typeof onNavigateSection === 'function') {
        onNavigateSection('complaints');
      } else {
        navigate('/complaints');
      }
    } else if (category.startsWith('EVENT')) {
      if (typeof onNavigateSection === 'function') {
        onNavigateSection('events');
      } else {
        navigate('/events');
      }
    } else if (category.startsWith('SCHEME')) {
      if (typeof onNavigateSection === 'function') {
        onNavigateSection('schemes');
      } else {
        navigate('/schemes');
      }
    } else if (item.action_url) {
      navigate(item.action_url);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <div
        style={{
          backgroundColor: '#f3f4f6',
          padding: '1px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          aria-label="Open notifications"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            padding: '6px',
            backgroundColor: isOpen ? '#e5e7eb' : 'transparent',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
        >
          <Bell style={{ width: '18px', height: '18px', color: isOpen ? '#1f2937' : '#6b7280' }} />

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: 'calc(100vw - 24px)',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '520px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '12px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#2563eb',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '4px 12px',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: !filterUnreadOnly ? '600' : '500',
                color: !filterUnreadOnly ? '#1d4ed8' : '#6b7280',
                backgroundColor: !filterUnreadOnly ? '#eff6ff' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: filterUnreadOnly ? '600' : '500',
                color: filterUnreadOnly ? '#1d4ed8' : '#6b7280',
                backgroundColor: filterUnreadOnly ? '#eff6ff' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Unread only {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notifications List (Scrollable) */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '400px',
              backgroundColor: '#ffffff',
            }}
          >
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 16px',
                  color: '#6b7280',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: '#9ca3af',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>
                  No notifications
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                  {filterUnreadOnly ? 'You have caught up with all notifications.' : 'You will see notifications and alerts here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getCategoryMeta(item.category, item.priority);
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: isUnread ? '#f8fafc' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                      borderLeft: isUnread ? `3px solid ${meta.borderColor}` : '3px solid transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#f1f5f9' : '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#f8fafc' : '#ffffff';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: meta.badgeBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '3px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: meta.badgeColor,
                              backgroundColor: meta.badgeBg,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {meta.label}
                          </span>

                          <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: isUnread ? '700' : '600',
                            color: isUnread ? '#0f172a' : '#334155',
                            lineHeight: 1.35,
                            marginBottom: '4px',
                          }}
                        >
                          {item.title}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.message}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#2563eb',
                            flexShrink: 0,
                            marginTop: '6px',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
