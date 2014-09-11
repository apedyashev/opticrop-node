exports.random = (low, high)->
    return parseInt(Math.random() * (high - low) + low)