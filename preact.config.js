export default (config, env, helpers) => {
    let uglify = helpers.getPluginsByName(config, 'UglifyJsPlugin')[0];
    if (uglify) {
        uglify.plugin.options.sourceMap = false;
    }
};