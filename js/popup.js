document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const cropperContainer = document.getElementById('cropperContainer');
    const imageUrl = document.getElementById('imageUrl');
    const loadUrlButton = document.getElementById('loadUrlButton');
    const uploadTypeFile = document.getElementById('uploadTypeFile');
    const uploadTypeUrl = document.getElementById('uploadTypeUrl');
    const fileUploadOption = document.getElementById('fileUploadOption');
    const urlUploadOption = document.getElementById('urlUploadOption');
    let cropper = null;
    let currentShape = 'rect';
    let currentZoom = 100;
    let currentRotation = 0;
    let isFlippedHorizontal = false;
    let isFlippedVertical = false;
    const shapes = {
        rect: {
            aspectRatio: NaN,
            cropBoxResizable: true
        },
        circle: {
            aspectRatio: 1,
            cropBoxResizable: true,
            viewMode: 1
        },
        heart: {
            aspectRatio: 1,
            cropBoxResizable: true,
            viewMode: 1
        },
        polygon: {
            aspectRatio: NaN,
            cropBoxResizable: true,
            viewMode: 1
        }
    };

    // 语言相关
    // let currentLang = 'en';
    // let translations = {};

    // // 更新页面文本
    // function updatePageText() {
    //     console.log('Current translations:', translations);  // 调试输出
    //     document.querySelectorAll('[data-i18n]').forEach(element => {
    //         const key = element.getAttribute('data-i18n');
    //         console.log('Updating element:', element, 'key:', key, 'value:', getNestedValue(translations, key));  // 调试输出
    //         const value = getNestedValue(translations, key);
    //         if (value) {
    //             if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
    //                 element.placeholder = value;
    //             } else {
    //                 element.textContent = value;
    //             }
    //         }
    //     });

    //     // 更新当前语言显示
    //     document.querySelector('.current-lang').textContent = 
    //         currentLang === 'en' ? 'English' : 
    //         currentLang === 'zh' ? '简体中文' : 
    //         currentLang === 'zh-tw' ? '繁體中文' :
    //         currentLang === 'ja' ? '日本語' : 
    //         currentLang === 'ko' ? '한국어' :
    //         currentLang === 'hi' ? 'हिंदी' :
    //         'English';
    // }

    // 获取嵌套对象的值
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : undefined, obj);
    }

    // 语言切换事件监听
    // document.querySelectorAll('.dropdown-item[data-lang]').forEach(item => {
    //     item.addEventListener('click', function(e) {
    //         const lang = this.getAttribute('data-lang');
    //         currentLang = lang;
    //     });
    // });

    // 初始化语言
    // const pathParts = window.location.pathname.split('/');
    // const lang = pathParts[1] || 'en';
    // currentLang = lang;
    // translations = window.translations || {};
    // console.log(11);
    // console.log(translations);
    // updatePageText();

    // 切换上传类型
    uploadTypeFile.addEventListener('change', function() {
        fileUploadOption.style.display = 'block';
        urlUploadOption.style.display = 'none';
    });

    uploadTypeUrl.addEventListener('change', function() {
        fileUploadOption.style.display = 'none';
        urlUploadOption.style.display = 'block';
    });

    // 拖放功能
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });

    // 加载远程图片
    loadUrlButton.addEventListener('click', function() {
        const url = imageUrl.value.trim();
        if (url) {
            // 显示加载状态
            loadUrlButton.disabled = true;
            loadUrlButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
            
            // 发送请求到后端
            fetch('https://cropimage.app/index/cropUpload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'url=' + encodeURIComponent(url)
            })
            .then(response => response.json())
            .then(data => {
                if (data.code === 0) {
                    // 加载图片并初始化裁剪器
                    const image = document.getElementById('cropImage');
                    image.src = 'https://cropimage.app/' + data.data.url;
                    initCropper(image);
                    cropperContainer.style.display = 'block';
                    cropperContainer.scrollIntoView({ behavior: 'smooth' });
                    imageUrl.value = '';  // 清空输入框
                } else {
                    alert(data.msg || 'Failed to load image');
                }
            })
            .catch(error => {
                alert('Failed to load image: ' + error.message);
            })
            .finally(() => {
                // 恢复按钮状态
                loadUrlButton.disabled = false;
                loadUrlButton.innerHTML = '<i class="fas fa-link me-2"></i>Load';
            });
        } else {
            alert('Please enter a valid image URL');
        }
    });

    // 处理文件上传
    function handleFiles(files) {
        if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const image = document.getElementById('cropImage');
                    image.src = e.target.result;
                    image.onload = function() {
                        cropperContainer.style.display = 'block';
                        initCropper(image);  // 传入图片元素而不是URL
                        cropperContainer.scrollIntoView({ behavior: 'smooth' });
                    };
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // 初始化裁剪器
    function initCropper(image) {
        if (cropper) {
            cropper.destroy();
        }

        // 确保传入的是DOM元素
        if (!(image instanceof HTMLElement)) {
            const img = document.getElementById('cropImage');
            if (img) {
                image = img;
            } else {
                console.error('No image element found');
                return;
            }
        }

        cropper = new Cropper(image, {
            aspectRatio: NaN,
            viewMode: 2,
            dragMode: 'move',
            cropBoxResizable: true,
            cropBoxMovable: true,
            toggleDragModeOnDblclick: true,
            autoCropArea: 0.8,
            responsive: true,
            ready: function() {
                // 初始化完成后设置初始缩放值
                currentZoom = 100;
                document.getElementById('zoomRange').value = currentZoom;
                document.getElementById('zoomValue').textContent = currentZoom + '%';
            }
        });

        // 初始化图片控制功能
        initializeImageControls();
    }

    // 添加形状遮罩
    function applyShapeMask(shape) {
        const cropBox = document.querySelector('.cropper-crop-box');
        const viewBox = document.querySelector('.cropper-view-box');
        
        // 移除现有的遮罩
        const existingMask = document.querySelector('.shape-mask');
        if (existingMask) {
            existingMask.remove();
        }
        
        // 重置所有样式
        cropBox.style.overflow = 'visible';
        cropBox.style.borderRadius = '0';
        viewBox.style.borderRadius = '0';
        
        if (shape === 'circle') {
            cropBox.style.overflow = 'hidden';
            cropBox.style.borderRadius = '50%';
            viewBox.style.borderRadius = '50%';
        } else if (shape === 'heart') {
            const mask = document.createElement('div');
            mask.className = 'shape-mask heart-mask';
            mask.style.width = '100%';
            mask.style.height = '100%';
            cropBox.appendChild(mask);
            cropBox.style.overflow = 'hidden';
        } else if (shape === 'polygon') {
            const mask = document.createElement('div');
            mask.className = 'shape-mask polygon-mask';
            mask.style.width = '100%';
            mask.style.height = '100%';
            cropBox.appendChild(mask);
            cropBox.style.overflow = 'hidden';
        }
    }

    // 监听裁剪尺寸输入
    // ['cropWidth', 'cropHeight', 'cropX', 'cropY'].forEach(id => {
    //     document.getElementById(id).addEventListener('change', function() {
    //         if (cropper) {
    //             const data = {
    //                 x: parseInt(document.getElementById('cropX').value),
    //                 y: parseInt(document.getElementById('cropY').value),
    //                 width: parseInt(document.getElementById('cropWidth').value),
    //                 height: parseInt(document.getElementById('cropHeight').value)
    //             };
    //             cropper.setData(data);
    //         }
    //     });
    // });

    // 裁剪按钮点击事件
    document.getElementById('cropButton').addEventListener('click', function() {
        if (cropper) {
            const format = document.getElementById('outputFormat').value;
            const mimeType = `image/${format}`;
            const quality = format === 'jpeg' ? 0.9 : 1;

            const canvas = cropper.getCroppedCanvas({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            // 如果选择了特殊形状，应用形状遮罩到导出的画布
            if (currentShape !== 'rect') {
                applyShapeToCanvas(canvas, currentShape);
            }

            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cropped-image.${format}`;
                a.click();
                URL.revokeObjectURL(url);
            }, mimeType, quality);
        }
    });

    // 形状选择事件监听
    document.querySelectorAll('input[name="cropShape"]').forEach(input => {
        input.addEventListener('change', function() {
            currentShape = this.value;
            if (cropper) {
                cropper.setAspectRatio(shapes[currentShape].aspectRatio);
                applyShapeMask(currentShape);
            }
        });
    });

    // 将形状应用到导出画布
    function applyShapeToCanvas(canvas, shape) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 保存原始图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 创建临时画布用于绘制形状
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (shape === 'circle') {
            tempCtx.beginPath();
            tempCtx.arc(width/2, height/2, Math.min(width, height)/2, 0, Math.PI * 2);
            tempCtx.closePath();
            tempCtx.fill();
        } else if (shape === 'heart') {
            drawHeart(tempCtx, width, height);
            tempCtx.fill();
        } else if (shape === 'polygon') {
            drawPolygon(tempCtx, width, height, 6);
            tempCtx.fill();
        }
        
        // 使用临时画布作为遮罩
        ctx.putImageData(imageData, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }

    // 绘制心形
    function drawHeart(ctx, width, height) {
        const scale = Math.min(width, height) / 100;
        ctx.beginPath();
        ctx.moveTo(50 * scale, 15 * scale);
        
        // 左上曲线
        ctx.bezierCurveTo(
            55 * scale, 10 * scale,
            65 * scale, 0,
            85 * scale, 0
        );
        
        // 右上角
        ctx.bezierCurveTo(
            95 * scale, 0,
            100 * scale, 5 * scale,
            100 * scale, 15 * scale
        );
        
        // 右侧曲线
        ctx.bezierCurveTo(
            100 * scale, 25 * scale,
            95 * scale, 35 * scale,
            90 * scale, 45 * scale
        );
        
        // 右下曲线
        ctx.bezierCurveTo(
            85 * scale, 55 * scale,
            75 * scale, 65 * scale,
            50 * scale, 95 * scale
        );
        
        // 左下曲线
        ctx.bezierCurveTo(
            25 * scale, 65 * scale,
            15 * scale, 55 * scale,
            10 * scale, 45 * scale
        );
        
        // 左侧曲线
        ctx.bezierCurveTo(
            5 * scale, 35 * scale,
            0, 25 * scale,
            0, 15 * scale
        );
        
        // 左上角
        ctx.bezierCurveTo(
            0, 5 * scale,
            5 * scale, 0,
            15 * scale, 0
        );
        
        // 完成左半部分
        ctx.bezierCurveTo(
            35 * scale, 0,
            45 * scale, 10 * scale,
            50 * scale, 15 * scale
        );
        ctx.closePath();
    }

    // 绘制多边形
    function drawPolygon(ctx, width, height, sides) {
        const radius = Math.min(width, height) / 2;
        ctx.beginPath();
        ctx.moveTo(width/2 + radius * Math.cos(0), height/2 + radius * Math.sin(0));
        
        for (let i = 1; i <= sides; i++) {
            const angle = i * 2 * Math.PI / sides;
            ctx.lineTo(
                width/2 + radius * Math.cos(angle),
                height/2 + radius * Math.sin(angle)
            );
        }
        ctx.closePath();
    }

    // 添加重置按钮事件监听
    document.getElementById('resetButton').addEventListener('click', function() {
        if (cropper) {
            cropper.reset();
            cropper.setAspectRatio(NaN);
        }
    });

    // 初始化图片控制功能
    function initializeImageControls() {
        // 缩放控制
        document.getElementById('zoomRange').addEventListener('input', function(e) {
            const value = parseInt(e.target.value);
            setZoom(value);
        });

        document.getElementById('zoomIn').addEventListener('click', function() {
            if (cropper) {
                const newZoom = Math.min(Math.round(currentZoom * 1.1), 200);
                setZoom(newZoom);
            }
        });

        document.getElementById('zoomOut').addEventListener('click', function() {
            if (cropper) {
                const newZoom = Math.max(Math.round(currentZoom * 0.9), 10);
                setZoom(newZoom);
            }
        });

        // 旋转控制
        document.getElementById('rotateLeft').addEventListener('click', function() {
            currentRotation -= 90;
            cropper.rotateTo(currentRotation);
        });

        document.getElementById('rotateRight').addEventListener('click', function() {
            currentRotation += 90;
            cropper.rotateTo(currentRotation);
        });

        // 翻转控制
        document.getElementById('flipHorizontal').addEventListener('click', function() {
            isFlippedHorizontal = !isFlippedHorizontal;
            cropper.scaleX(isFlippedHorizontal ? -1 : 1);
        });

        document.getElementById('flipVertical').addEventListener('click', function() {
            isFlippedVertical = !isFlippedVertical;
            cropper.scaleY(isFlippedVertical ? -1 : 1);
        });
    }

    function setZoom(value) {
        if (cropper) {
            try {
                // 将值四舍五入到两位小数
                value = Math.round(value * 100) / 100;
                
                // 使用相对缩放
                const delta = (value - currentZoom) / 100;
                // 限制缩放范围并四舍五入
                currentZoom = Math.min(Math.max(Math.round(value), 10), 200);
                
                // 确保delta不会太小，避免无效缩放
                if (Math.abs(delta) >= 0.01) {
                    cropper.zoom(delta);
                }
                
                document.getElementById('zoomRange').value = currentZoom;
                document.getElementById('zoomValue').textContent = currentZoom + '%';
            } catch (error) {
                console.error('Zoom error:', error);
            }
        }
    }
}); 