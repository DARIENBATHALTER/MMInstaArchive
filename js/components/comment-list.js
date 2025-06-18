/**
 * CommentList Component - Handles comment rendering and interactions
 * This component can be extended for more advanced comment features
 */
class CommentListComponent {
    constructor(container, exportService) {
        this.container = container;
        this.exportService = exportService;
        this.comments = [];
        this.isLoading = false;
        
        this.setupEventHandlers();
    }

    /**
     * Setup event handlers for comment list
     */
    setupEventHandlers() {
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.export-btn') || e.target.closest('.export-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.export-btn');
                const commentId = btn.dataset.commentId;
                this.onCommentExport?.(commentId);
            }
        });

        // Setup virtual scrolling if container gets large
        this.setupVirtualScrolling();
    }

    /**
     * Setup virtual scrolling for performance with large comment lists
     */
    setupVirtualScrolling() {
        // Basic implementation - can be enhanced for better performance
        let isScrolling = false;
        
        this.container.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    this.onScroll?.();
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    /**
     * Render comments list
     */
    render(comments, append = false) {
        this.isLoading = true;
        
        const html = comments.map(comment => this.createCommentCard(comment)).join('');
        
        if (append) {
            this.container.insertAdjacentHTML('beforeend', html);
            this.comments.push(...comments);
        } else {
            this.container.innerHTML = html;
            this.comments = [...comments];
        }
        
        this.isLoading = false;
        this.updateInteractiveElements();
    }

    /**
     * Create comment card HTML with replies
     */
    createCommentCard(comment) {
        let html = this.createSingleComment(comment, false);
        
        // Add replies if any
        if (comment.replies && comment.replies.length > 0) {
            const repliesHtml = comment.replies.map(reply => 
                this.createSingleComment(reply, true)
            ).join('');
            html += repliesHtml;
        }
        
        return html;
    }

    /**
     * Create single comment HTML
     */
    createSingleComment(comment, isReply = false) {
        const avatarColor = this.generateAvatarColor(comment.author);
        const firstLetter = comment.author[1]?.toUpperCase() || comment.author[0]?.toUpperCase() || 'U';
        const date = new Date(comment.published_at || comment.commentAt).toLocaleDateString();
        const likes = this.formatNumber(comment.like_count || comment.reactionsCount);
        const heartIcon = comment.channel_owner_liked ? '❤️' : '';
        
        const cardClass = isReply ? 'reply-card comment-card' : 'comment-card';
        const avatarSize = isReply ? '28' : '32';
        const avatarFontSize = isReply ? '0.8rem' : '1rem';
        
        // Use local avatar for medicalmedium, Instagram profile picture for others, otherwise fallback to colored initial
        const avatarUrl = comment.author === 'medicalmedium' ? 'MMCommentExplorer.webp' : comment.avatar;
        const avatarElement = avatarUrl ? `
            <img src="${avatarUrl}" 
                 alt="${this.escapeHTML(comment.author)}" 
                 style="
                     width: ${avatarSize}px; 
                     height: ${avatarSize}px; 
                     border-radius: 50%; 
                     object-fit: cover;
                     border: 1px solid #ddd;
                 "
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="
                background-color: ${avatarColor}; 
                width: ${avatarSize}px; 
                height: ${avatarSize}px; 
                border-radius: 50%; 
                display: none; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: 500;
                font-size: ${avatarFontSize};
            ">
                ${firstLetter}
            </div>
        ` : `
            <div style="
                background-color: ${avatarColor}; 
                width: ${avatarSize}px; 
                height: ${avatarSize}px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: 500;
                font-size: ${avatarFontSize};
            ">
                ${firstLetter}
            </div>
        `;
        
        return `
            <div class="${cardClass}">
                <div class="profile-avatar">
                    ${avatarElement}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHTML(comment.author)}</span>
                        <span class="comment-text">${this.highlightText(this.escapeHTML(comment.text || comment.content))}</span>
                    </div>
                    <div class="comment-actions">
                        <span class="comment-date">${date}</span>
                        <span class="comment-likes">${likes} likes</span>
                        <span class="comment-reply">Reply</span>
                        ${heartIcon ? `<span class="channel-owner-liked">${heartIcon}</span>` : ''}
                    </div>
                </div>
                <div class="comment-export" style="position: absolute; top: 12px; right: 16px; opacity: 0; transition: opacity 0.2s;">
                    <button class="btn btn-outline-primary btn-sm export-btn" 
                            data-comment-id="${comment.comment_id}"
                            title="Export this comment as PNG"
                            style="font-size: 10px; padding: 2px 6px;">
                        <i class="bi bi-download"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render loading skeleton
     */
    renderSkeleton(count = 5) {
        const skeletonComments = Array(count).fill(0).map(() => `
            <div class="comment-card skeleton">
                <div class="comment-header">
                    <div class="d-flex align-items-center">
                        <div class="skeleton" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px;"></div>
                        <div>
                            <div class="skeleton" style="width: 120px; height: 14px; margin-bottom: 4px;"></div>
                            <div class="skeleton" style="width: 80px; height: 12px;"></div>
                        </div>
                    </div>
                </div>
                <div class="skeleton" style="width: 100%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 80%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 60px; height: 14px;"></div>
            </div>
        `).join('');

        this.container.innerHTML = skeletonComments;
    }

    /**
     * Update interactive elements after rendering
     */
    updateInteractiveElements() {
        // Add tooltips to export buttons
        this.container.querySelectorAll('.export-btn').forEach(btn => {
            btn.title = 'Export this comment as PNG';
        });

        // Add click animations
        this.container.querySelectorAll('.comment-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-1px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * Highlight search terms in text
     */
    highlightText(text, searchTerm = '') {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Generate consistent avatar color for username
     */
    generateAvatarColor(username) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F39C12',
            '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71'
        ];
        const hash = this.hashString(username);
        return colors[hash % colors.length];
    }

    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Format numbers (1000 -> 1K)
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        }
        return num.toString();
    }

    /**
     * Escape HTML
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set search term for highlighting
     */
    setSearchTerm(term) {
        this.searchTerm = term;
        // Re-render with highlighting
        this.render(this.comments);
    }

    /**
     * Set comment export handler
     */
    setCommentExportHandler(handler) {
        this.onCommentExport = handler;
    }

    /**
     * Set scroll handler
     */
    setScrollHandler(handler) {
        this.onScroll = handler;
    }

    /**
     * Get current comments
     */
    getComments() {
        return [...this.comments];
    }

    /**
     * Clear comments
     */
    clear() {
        this.container.innerHTML = '';
        this.comments = [];
    }

    /**
     * Show empty state
     */
    showEmptyState(message = 'No comments found') {
        this.container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-chat-square-text" style="font-size: 3rem; opacity: 0.5;"></i>
                <p class="mt-3">${message}</p>
            </div>
        `;
    }
}

// Export for use in other modules
window.CommentListComponent = CommentListComponent; 