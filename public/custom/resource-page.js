/**
 * Resource Page JavaScript
 * Chuyển đổi từ React sang jQuery, Bootstrap
 */

$(document).ready(function () {
    // Simulated API client (replacing Supabase)
    const api = {
        async fetchPages() {
            return new Promise((resolve, reject) => {
                // Simulate API delay
                setTimeout(() => {
                    try {
                        const mockConnections = fetchDataGraphApi()
                            .then((data) => {
                                console.log("Updated mockConnections:" +  data);
                            });

                        // Simulate successful response from server
                        // const mockConnections = [
                        //     {
                        //         id: 'conn1',
                        //         page_id: 'page1',
                        //         status: 'connected',
                        //         facebook_page_details: [{
                        //             page_name: 'Thỏ Store',
                        //             page_category: 'Thời trang',
                        //             follower_count: 406,
                        //             page_avatar_url: null
                        //         }]
                        //     },
                        //     {
                        //         id: 'conn2',
                        //         page_id: 'page2',
                        //         status: 'connected',
                        //         facebook_page_details: [{
                        //             page_name: 'Coffee House',
                        //             page_category: 'Đồ uống',
                        //             follower_count: 823,
                        //             page_avatar_url: 'https://via.placeholder.com/56'
                        //         }]
                        //     },
                        //     {
                        //         id: 'conn3',
                        //         page_id: 'page3',
                        //         status: 'disconnected',
                        //         facebook_page_details: [{
                        //             page_name: 'Tech Shop',
                        //             page_category: 'Công nghệ',
                        //             follower_count: 215,
                        //             page_avatar_url: null
                        //         }]
                        //     }
                        // ];

                        // Transform the data similar to the React component
                        const transformedPages = mockConnections.map(conn => ({
                            id: conn.id,
                            name: conn.facebook_page_details?.[0]?.page_name || 'Unnamed Page',
                            verified: conn.id !== 'conn3', // Simulate verification status
                            category: conn.facebook_page_details?.[0]?.page_category || 'Unknown',
                            metrics: {
                                followers: conn.facebook_page_details?.[0]?.follower_count || 0,
                                likes: Math.floor(Math.random() * 10000), // Simulated likes count
                                engagement: Math.floor(Math.random() * 500),
                                reach: Math.floor(Math.random() * 10000),
                                responseRate: 75 + Math.floor(Math.random() * 25),
                                posts: 20 + Math.floor(Math.random() * 150)
                            },
                            status: conn.status === 'connected' ? 'active' : 'inactive',
                            avatar: conn.facebook_page_details?.[0]?.page_avatar_url
                        }));

                        resolve(transformedPages);
                    } catch (error) {
                        reject(error);
                    }
                }, 1500);
            });
        }
    };

    // Initialize state
    let dateRange = '30';
    let pages = [];
    let searchQuery = '';
    let isLoading = true;
    let totalFollowers = 0;

    // Initial loading
    init();

    function init() {
        fetchPages();
        setupEventListeners();
    }

    async function fetchDataGraphApi() {
        try {
            const response = await fetch("https://pmybhyeyienzwgthbfkh.supabase.co/functions/v1/get-pages-data", );
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    async function fetchPages() {
        try {
            isLoading = true;
            showLoading(true);

            // Fetch pages from API
            pages = await api.fetchPages();

            // Calculate total followers for statistics
            totalFollowers = pages.reduce((sum, page) => sum + page.metrics.followers, 0);

            // Render all UI elements
            renderStats();
            renderPages();
            showLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            showLoading(false);
        }
    }

    function setupEventListeners() {
        // Date range change
        $('#dateRange').on('change', function () {
            dateRange = $(this).val();
            renderStats();
        });

        // Search input
        $('#searchInput').on('input', function () {
            searchQuery = $(this).val().toLowerCase();
            renderPages();
        });

        // Add page button
        $('#addPageBtn').on('click', function () {
            $('#addPageModal').fadeIn(200);
        });

        // Export button
        $('#exportBtn').on('click', function () {
            $('#exportModal').fadeIn(200);
        });

        // Close modals
        $('#closeAddPageModal').on('click', function () {
            $('#addPageModal').fadeOut(200);
        });

        $('#closeExportModal').on('click', function () {
            $('#exportModal').fadeOut(200);
        });

        // Close modals when clicking outside
        $('.modal-backdrop').on('click', function (e) {
            if (e.target === this) {
                $(this).fadeOut(200);
            }
        });

        // Prevent modal content click from closing modal
        $('.modal-content').on('click', function (e) {
            e.stopPropagation();
        });

        // Close error alert
        $('#errorAlert').on('click', function () {
            $(this).fadeOut(200);
        });
    }

    function showLoading(show) {
        isLoading = show;
        if (show) {
            $('#loadingSpinner').show();
            $('#pagesContainer').hide();
            $('#emptyState').hide();
        } else {
            $('#loadingSpinner').hide();
        }
    }

    function showError(message) {
        $('#errorMessage').text(message);
        $('#errorAlert').fadeIn(300);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            $('#errorAlert').fadeOut(300);
        }, 5000);
    }

    function renderStats() {
        // Calculate statistics based on date range
        const multiplier = dateRange === '7' ? 0.7 : dateRange === '90' ? 1.3 : 1;

        const stats = [
            {
                title: 'Tổng Fanpage',
                value: pages.length,
                icon: 'facebook',
                change: {value: '+1', positive: true},
                color: 'blue'
            },
            {
                title: 'Tổng Người theo dõi',
                value: Math.round(totalFollowers * multiplier),
                icon: 'users',
                change: {value: '+5.2%', positive: true},
                total: (totalFollowers > 1000) ? (totalFollowers / 1000).toFixed(1) + 'K' : totalFollowers,
                color: 'green'
            },
            {
                title: 'Tương tác',
                value: Math.round(124 * multiplier),
                icon: 'share-nodes',
                change: {value: '+12.3%', positive: true},
                color: 'purple'
            },
            {
                title: 'Tổng tiếp cận',
                value: Math.round(3452 * multiplier).toLocaleString(),
                icon: 'eye',
                change: {value: '+8.1%', positive: true},
                color: 'orange'
            },
            {
                title: 'Tỷ lệ phản hồi',
                value: '92.5%',
                icon: 'message',
                change: {value: '-2.4%', positive: false},
                color: 'yellow'
            },
            {
                title: 'Tổng bài đăng',
                value: Math.round(85 * multiplier),
                icon: 'file-lines',
                change: {value: '+15.2%', positive: true},
                color: 'red'
            }
        ];

        const statsHtml = stats.map(stat => `
            <div class="col-md-6 col-lg-4">
                <div class="stat-card">
                    <div class="d-flex align-items-center mb-4">
                        <div class="icon-container icon-container-${stat.color}">
                            <i class="fas fa-${stat.icon} fa-lg"></i>
                        </div>
                        <span class="text-secondary">${stat.title}</span>
                    </div>
                    <div class="d-flex align-items-end">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-baseline gap-2">
                                <span class="fs-3 fw-bold">${stat.value}</span>
                                ${stat.title === 'Tổng Người theo dõi' && stat.total ?
            `<span class="text-secondary fs-6">(Tổng: ${stat.total})</span>` :
            ''}
                            </div>
                            ${stat.change ? `
                                <div class="d-flex align-items-center mt-1 ${stat.change.positive ? 'positive-change' : 'negative-change'}">
                                    <i class="fas fa-${stat.change.positive ? 'arrow-up' : 'arrow-down'} me-1"></i>
                                    ${stat.change.value}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        $('#statsContainer').html(statsHtml);
    }

    function renderPages() {
        const filteredPages = pages.filter(page =>
            page.name.toLowerCase().includes(searchQuery) ||
            page.category.toLowerCase().includes(searchQuery)
        );

        if (filteredPages.length === 0 && !isLoading) {
            $('#pagesContainer').hide();
            $('#emptyState').show();
            return;
        }

        $('#emptyState').hide();
        $('#pagesContainer').show();

        const pagesHtml = filteredPages.map(page => `
            <div class="page-card">
                <!-- Page Header -->
                <div class="row mb-3">
                    <div class="col-lg-8">
                        <div class="d-flex">
                            <!-- Avatar -->
                            <div class="avatar-container me-3">
                                ${page.avatar ?
            `<img src="${page.avatar}" alt="${page.name}" class="page-avatar">` :
            `<div class="default-avatar">
                                        <i class="fab fa-facebook fa-lg"></i>
                                    </div>`
        }
                            </div>
                            
                            <!-- Page Info -->
                            <div class="page-info">
                                <div class="d-flex align-items-center">
                                    <h5 class="page-name mb-0 truncate">${page.name}</h5>
                                    ${page.verified ?
            `<i class="fas fa-circle-check verified-badge"></i>` :
            ''
        }
                                </div>
                                <div class="d-flex align-items-center gap-3 mt-1">
                                    <div class="d-flex align-items-center gap-1 text-secondary small">
                                        <i class="fas fa-users"></i>
                                        <span>${page.metrics.followers.toLocaleString()}</span>
                                    </div>
                                    <div class="d-flex align-items-center gap-1 text-secondary small">
                                        <i class="fas fa-heart"></i>
                                        <span>${page.metrics.likes.toLocaleString()}</span>
                                    </div>
                                </div>
                                <p class="text-secondary small mt-1 mb-0">${page.category}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
                        <span class="badge rounded-pill py-2 px-3 ${page.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                            ${page.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                    </div>
                </div>
                
                <!-- Page Metrics -->
                <div class="page-metrics">
                    <div class="metric-item">
                        <div class="metric-icon icon-container-blue">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.metrics.followers.toLocaleString()}</div>
                            <div class="metric-label">followers</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-purple">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.metrics.engagement.toLocaleString()}</div>
                            <div class="metric-label">tương tác</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-green">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.metrics.reach.toLocaleString()}</div>
                            <div class="metric-label">tiếp cận</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-orange">
                            <i class="fas fa-comment"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.metrics.responseRate.toFixed(1)}%</div>
                            <div class="metric-label">phản hồi</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-red">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.metrics.posts}</div>
                            <div class="metric-label">bài viết</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        $('#pagesContainer').html(pagesHtml);
    }
});