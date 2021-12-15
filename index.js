const ApiBuilder = require('claudia-api-builder'),
      querystring = require('querystring'),
      AWS = require('aws-sdk'),
      { v4: uuidv4 } = require('uuid');

var api = new ApiBuilder(),
    dynamoDb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.TABLE_NAME;

function mostrarGastos(usuario, gastoId) {

    var condExp = (gastoId == undefined) ? 'usuario = :usuario' : 'usuario = :usuario and gastoId = :gastoId';

    var expAttrs = {
        ':usuario' : usuario
    };

    if (gastoId != undefined)
        expAttrs[':gastoId'] = gastoId;


    var params = {
        ExpressionAttributeValues: expAttrs,
        KeyConditionExpression: condExp,
        TableName: tableName
    };
    return dynamoDb.query(params).promise()
        .then(response => {
            return response.Items;
        })
}

// Gastos del usuario (GET)
api.get('/{usuario}', function (request) {
    var usuarioNombre = querystring.unescape(request.pathParams.usuario);
    return mostrarGastos(usuarioNombre);

});

// POST
api.post('/{usuario}', function (request) {
    var data = request.body;
    var usuarioNombre = querystring.unescape(request.pathParams.usuario);
    data.usuario = usuarioNombre;
    // Generar UUID
    data.gastoId = uuidv4();
    var params = {
        TableName: tableName,
        Item: data
    }
    return dynamoDb.put(params).promise();
}, { success: 201 });


// Gasto de un usuario (GET)
api.get('/{usuario}/{gastoId}', function (request) {
    var usuarioNombre = querystring.unescape(request.pathParams.usuario);
    var gastoId = querystring.unescape(request.pathParams.gastoId);
    return mostrarGastos(usuarioNombre, gastoId).then(items => {
        return (items.length>0) ? items[0] : {};
    });

});

// PUT
api.put('/{usuario}/{gastoId}', function (request) {
    var data = request.body;
    var usuarioNombre = querystring.unescape(request.pathParams.usuario);
    var gastoId = querystring.unescape(request.pathParams.gastoId);
    data.usuario = usuarioNombre;
    data.gastoId = gastoId;
    var params = {
        TableName: tableName,
        Item: data
    }
    return dynamoDb.put(params).promise();
}, { success: 200 });

// DELETE
api.delete('/{usuario}/{gastoId}', function (request) {
    var usuarioNombre = querystring.unescape(request.pathParams.usuario);
    var gastoId = querystring.unescape(request.pathParams.gastoId);
    var params = {
        TableName: tableName,
        Key: {
            usuario: usuarioNombre,
            gastoId: gastoId
        },
        ReturnValues: "ALL_OLD"
    }
    return dynamoDb.delete(params).promise().then(response => {
        if (!response.Attributes) {
            throw new Error("El elemento no existe");
        }
    });
}, {
    success: { code: 200 },
    error: {code: 401}
});


module.exports = api;
