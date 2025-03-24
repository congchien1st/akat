import {supabase} from "../../src/lib/supabase.js";
// import fs from 'fs';
// import path from 'path';
//
// const { window } = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
// const $ = jquery(window);

/**
 * Resource Page JavaScript
 * Chuyển đổi từ React sang jQuery, Bootstrap
 */
// import { createClient } from '@supabase/supabase-js'
const { createClient } = supabase

$(document).ready(function () {
    let result;

    // console.log("API " + JSON.stringify(api));
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

    async function fetchDataGraphApi(connection_id) {
        try {
            // console.log("CONNECTION_ID: " + connection_id);
            // const {data: {session}, error: errorSession} = await supabase.auth.getSession();
            // console.log("SESSION Here: "+    session.access_token);

            const response =  await fetch('http://127.0.0.1:54321/functions/v1/get-pages-data',{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlM2SVdWSGdteEhRODFOUWsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3BteWJoeWV5aWVuendndGhiZmtoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlNWJmODA4OC0yZTU0LTQ1MmMtODZjNi1lMjRkZTEyM2U1YTciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQyODE3MTY4LCJpYXQiOjE3NDI4MTM1NjgsImVtYWlsIjoidGVzdDEyMzRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InRlc3QxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV9udW1iZXIiOiIwMzU0NDQzMzIyIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJlNWJmODA4OC0yZTU0LTQ1MmMtODZjNi1lMjRkZTEyM2U1YTcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0MTU5NTQ4NH1dLCJzZXNzaW9uX2lkIjoiMGE5ZDdjZTItNzA2Zi00M2NkLWIxYzktMjhiMDIzNzA1MzdmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.lvhDQGZB9eWsxdA6pgvVh0aH9DLuachtHJ0NCwaYmyw'
                },
                body: JSON.stringify({
                    connection_id: connection_id
                })
            });

            const dataInvoke = await response.json();
            // console.log('data invoke:', dataInvoke);
            return dataInvoke;
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
            // pages = await api.fetchPagesNow();
            pages = await fetchPagesNow("5562a223-ba4f-463d-9c9c-c30df3fb6dc6");
            // console.log("pages: " + JSON.stringify(pages));

            // Calculate total followers for statistics
            // totalFollowers = pages.reduce((sum, page) => sum + page.metrics.followers, 0);
            /**
             * {} la gia tri mac dinh, acc la object tích lũy, item la phan tu hien tai trong mang
             */
            pages.reduce((acc, item) => {
                // Lấy key từ item.id, giá trị là item.name
                // acc[item.id] = item.name;
                result = {
                    id: item.id,
                    name: item.name,
                    image_url: item.image_url,
                    posts: item.posts,
                    approach: item.approach,
                    interactions: item.interactions,
                    follows: item.follows
                };
                // return acc;
            }, {});
            // console.log(result);

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
    // console.log("RESULT " + result.follows);

    async function fetchPagesNow(connection_id) {
        try {
            // Gọi API để lấy data (đã parse JSON)
            const data = await fetchDataGraphApi(connection_id);
            // console.log("NEWWW"+data);

            // Biến đổi data => result
            return data.map(item => ({
                id: item.id,
                name: item.name,
                image_url: item.image_url,
                posts: item.posts,
                approach: item.approach,
                interactions: item.interactions,
                follows: item.follows
            }));

            // Trả về result
            // return result;
        } catch (error) {
            console.error("Error fetching pages:", error);
            return [];
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
                // value: pages.length,
                icon: 'facebook',
                change: {value: '+1', positive: true},
                color: 'blue'
            },
            {
                title: 'Tổng Người theo dõi',
                value: result.follows,
                icon: 'users',
                change: {value: '+5.2%', positive: true},
                total: (result.follows > 1000) ? (result.follows / 1000).toFixed(1) + 'K' : result.follows,
                color: 'green'
            },
            {
                title: 'Tương tác',
                value: result.interactions,
                icon: 'share-nodes',
                change: {value: '+12.3%', positive: true},
                color: 'purple'
            },
            {
                title: 'Tổng tiếp cận',
                value: result.approach,
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
                value: result.posts,
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
        // const filteredPages = pages.filter(page =>
        //     page.name.toLowerCase().includes(searchQuery)
        //     // || page.category.toLowerCase().includes(searchQuery)
        // );
        const filteredPages = pages;
        console.log(JSON.stringify(filteredPages));

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
        `).join('');

        $('#pagesContainer').html(pagesHtml);
    }
});