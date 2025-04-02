import {supabase} from "../../src/lib/supabase.js";

/**
 * Resource Page JavaScript
 * Chuyển đổi từ React sang jQuery, Bootstrap
 */
const {createClient} = supabase

$(document).ready(function () {
    let result;

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
            /**
             * get session bang supabase or localStorage
             */
            const {data, error} = await supabase.auth.getSession();

            // http://127.0.0.1:54321/functions/v1/get-pages-data
            const response = await fetch('http://127.0.0.1:54321/functions/v1/get-pages-data', {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session.access_token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    async function fetchPages() {
        try {
            isLoading = true;
            showLoading(true);

            pages = await fetchPagesNow();

            /**
             * {} la gia tri mac dinh, acc la object tích lũy, item la phan tu hien tai trong mang
             */
            const result = pages.reduce((acc, item) => {
                acc.push({
                    id: item.id,
                    posts: item.posts,
                    approach: item.approach,
                     interactions: item.interactions,
                    follows: item.follows,
                    name: item.name,
                    image_url: item.image_url
                });
                return acc;
            }, []);

            /**
             * {} la gia tri mac dinh, acc la object tích lũy, item la phan tu hien tai trong mang
             */
            const totalStats = result.reduce(
                (acc, item) => {
                    acc.totalPosts += item.posts;
                    acc.totalApproach += item.approach;
                    acc.totalInteractions += item.interactions;
                    acc.totalFollows += item.follows;
                    return acc;
                },
                {totalPosts: 0, totalApproach: 0, totalInteractions: 0, totalFollows: 0}
            );

            // Render all UI elements
            renderStats(totalStats, result.length);
            renderPages();
            showLoading(false);
        } catch (error) {
            console.error('Error fetching pages:', error);
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            showLoading(false);
        }
    }

    async function fetchPagesNow() {
        try {
            const data = await fetchDataGraphApi();

            // Biến đổi data => result
            return data.map(item => ({
                id: item.id,
                posts: item.posts,
                approach: item.approach,
                interactions: item.interactions,
                follows: item.follows,
                name: item.name,
                image_url: item.image_url,
            }));
        } catch (error) {
            console.error("Error fetching pages:", error);
            return [];
        }
    }

    function setupEventListeners() {
        // Date range change
        $('#dateRange').on('change', function () {
            dateRange = $(this).val();
            renderStats(totalStats, result.length);
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

    function renderStats(totalStats, totalPages) {
        // Calculate statistics based on date range
        const multiplier = dateRange === '7' ? 0.7 : dateRange === '90' ? 1.3 : 1;

        const stats = [
            {
                title: 'Tổng Fanpage',
                value: totalPages,
                icon: 'facebook',
                change: {value: '+1', positive: true},
                color: 'blue'
            },
            {
                title: 'Tổng Người theo dõi',
                value: totalStats.totalFollows,
                icon: 'users',
                change: {value: '+5.2%', positive: true},
                total: (totalStats.totalFollows > 1000) ? (totalStats.totalFollows / 1000).toFixed(1) + 'K' : totalStats.totalFollows,
                color: 'green'
            },
            {
                title: 'Tương tác',
                value: totalStats.totalInteractions,
                icon: 'share-nodes',
                change: {value: '+12.3%', positive: true},
                color: 'purple'
            },
            {
                title: 'Tổng tiếp cận',
                value: totalStats.totalApproach,
                icon: 'eye',
                change: {value: '+8.1%', positive: true},
                color: 'orange'
            },
            // {
            //     title: 'Tỷ lệ phản hồi',
            //     value: '92.5%',
            //     icon: 'message',
            //     change: {value: '-2.4%', positive: false},
            //     color: 'yellow'
            // },
            {
                title: 'Tổng bài đăng',
                value: totalStats.totalPosts,
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
        const filteredPages = pages;
        // console.log("PAGES: " + JSON.stringify(pages));

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
                                ${page.image_url ?
            `<img src="${page.image_url}" alt="${page.name}" class="page-avatar">` :
            `<div class="default-avatar"><i class="fab fa-facebook fa-lg"></i></div>`}</div>
                            
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
                                        <span>${page.follows}</span>
                               
                                </div>
<!--                                <p class="text-secondary small mt-1 mb-0">${page.category}</p>-->
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
                            <div class="metric-value">${page.follows}</div>
                            <div class="metric-label">followers</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-purple">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.interactions}</div>
                            <div class="metric-label">tương tác</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-green">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.approach}</div>
                            <div class="metric-label">tiếp cận</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-orange">
                            <i class="fas fa-comment"></i>
                        </div>
                        <div>
                            <div class="metric-value">80%...</div>
                            <div class="metric-label">phản hồi</div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-icon icon-container-red">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div>
                            <div class="metric-value">${page.posts}</div>
                            <div class="metric-label">bài viết</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        `).join('');

        $('#pagesContainer').html(pagesHtml);
    }
});