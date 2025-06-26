document.addEventListener('DOMContentLoaded', () => {
    // テーマ切り替え機能
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // ローカルストレージからテーマを取得、またはシステム設定を確認
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // 初期テーマを適用
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // テーマ切り替えボタンのクリックイベント
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // テーマを切り替え
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // ローカルストレージに保存
        localStorage.setItem('theme', newTheme);
        
        // アニメーション効果
        document.documentElement.classList.add('theme-transition');
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    });
    
    // システムのテーマ設定が変更された場合の対応
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
        }
    });
    
    // 要素を取得
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sessionCount = document.getElementById('sessionCount');
    const statusText = document.getElementById('status');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');
    
    // 変数の初期化
    let timeLeft = 25 * 60; // 25分を秒で表現
    let timerId = null;
    let isPaused = true;
    let isWorkTime = true;
    let sessionsCompleted = 0;
    
    // 初期表示を更新
    updateDisplay();
    
    // イベントリスナーを設定
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    workDurationInput.addEventListener('change', updateDurations);
    breakDurationInput.addEventListener('change', updateDurations);
    
    // タイマーを開始する関数
    function startTimer() {
        if (isPaused) {
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = true;
            
            // アニメーションを追加
            timeDisplay.classList.add('animate__pulse');
            timeDisplay.style.animationDuration = '2s';
            
            timerId = setInterval(updateTimer, 1000);
        }
    }
    
    // タイマーを一時停止する関数
    function pauseTimer() {
        if (!isPaused) {
            isPaused = true;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            clearInterval(timerId);
            
            // アニメーションをリセット
            timeDisplay.classList.remove('animate__pulse');
            void timeDisplay.offsetWidth; // リフローを強制
            timeDisplay.classList.add('animate__pulse');
            timeDisplay.style.animationPlayState = 'paused';
        }
    }
    
    // タイマーをリセットする関数
    function resetTimer() {
        pauseTimer();
        isWorkTime = true;
        updateDurations();
        statusText.textContent = '作業時間';
        statusText.classList.remove('status-break');
        statusText.classList.add('status-work');
        
        // アニメーションをリセット
        timeDisplay.classList.remove('animate__pulse');
        timeDisplay.style.animationPlayState = 'running';
        
        updateDisplay();
    }
    
    // タイマーを更新する関数
    function updateTimer() {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            // 時間切れ
            clearInterval(timerId);
            
            // 通知音を再生（ブラウザによってはユーザー操作が必要な場合があります）
            playNotificationSound();
            
            // 作業時間と休憩時間を切り替え
            isWorkTime = !isWorkTime;
            
            if (!isWorkTime) {
                // 作業時間が終了（休憩時間に移行）
                sessionsCompleted++;
                sessionCount.textContent = sessionsCompleted;
                statusText.textContent = '休憩時間';
                timeLeft = parseInt(breakDurationInput.value) * 60;
            } else {
                // 休憩時間が終了（作業時間に移行）
                statusText.textContent = '作業時間';
                timeLeft = parseInt(workDurationInput.value) * 60;
            }
            
            // 次のセッションを自動的に開始
            startTimer();
        }
    }
    
    // 表示を更新する関数
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 作業時間と休憩時間で色とスタイルを変更
        if (isWorkTime) {
            document.documentElement.style.setProperty('--primary-color', '#6a11cb');
            document.documentElement.style.setProperty('--secondary-color', '#2575fc');
            statusText.classList.remove('status-break');
            statusText.classList.add('status-work');
        } else {
            document.documentElement.style.setProperty('--primary-color', '#ff4d4d');
            document.documentElement.style.setProperty('--secondary-color', '#ff8a5c');
            statusText.classList.remove('status-work');
            statusText.classList.add('status-break');
        }
    }
    
    // 作業時間と休憩時間の設定を更新する関数
    function updateDurations() {
        if (isPaused) {
            timeLeft = isWorkTime ? 
                parseInt(workDurationInput.value) * 60 : 
                parseInt(breakDurationInput.value) * 60;
            updateDisplay();
        }
    }
    
    // 通知音を再生する関数
    function playNotificationSound() {
        try {
            // ブラウザのオーディオコンテキストを作成
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            
            // オシレーターノードを作成
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // オシレーターの設定
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // ラの音
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            
            // エンベロープ設定（音の立ち上がりと減衰）
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            
            // ビブラート効果を追加
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.4);
            
            // ノードを接続
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // アニメーションを追加
            document.body.classList.add('notification-effect');
            setTimeout(() => {
                document.body.classList.remove('notification-effect');
            }, 1000);
            
            // 音を鳴らす
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.8);
            
        } catch (e) {
            console.error('音声の再生に失敗しました:', e);
        }
    }
});
