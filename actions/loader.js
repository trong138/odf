module.exports = {
    'login' : require('./login'),
    'info' : require('./info'),
    'start': require('./start'),
    // 'switch' : require('./switch'),
    // 'update' : require('./update'),
    'finish' : require('./finish'),
    // 'commit' : require('./git_commit'),
    'init': require('./init'),
    // 'feedback' : require('./feedback'),
    // 'issue' : require('./issue'),
    'me' : require('./me'),
    'pause' : require('./pause'),
    // 'resume' : require('./resume'),    
    '*': require('./git_proxy'),
}