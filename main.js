// importa os bibliotecas necessários
const serialport = require('serialport');  /* comunicação com o Arduino via cabo USB. */
const express = require('express');  /* cria a API (servidor web).*/
const mysql = require('mysql2');       /* conecta e insere dados no banco MySQL   */

// constantes para configurações
const SERIAL_BAUD_RATE = 9600;   /* velocidade de comunicação entre o arduino e o NodeJS. 9600 bit por segundo*/
const SERVIDOR_PORTA = 3300;   /* a porta que o servidor vai rodar */

// habilita ou desabilita a inserção de dados no banco de dados
const HABILITAR_OPERACAO_INSERIR = true;

// função para comunicação serial 
const serial = async (
    valoresSensorAnalogico,
    //valoresSensorDigital,
) => {


    // conexão com o banco de dados MySQL
    let poolBancoDados = mysql.createPool(
        {
            host: 'localhost',
            user: 'aluno',
            password: 'Sptech#2024',
            database: 'nh3',
            port: 3307
        }
    ).promise();

    // BLOCO 2

    // lista as portas seriais disponíveis e procura pelo Arduino
    const portas = await serialport.SerialPort.list();  /* aqui ele ta criando uma lista de todas as portas USB */
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);  /* 2341 e 43 são os identificadores do fabricante e o modelo do arduino*/
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
    }

    // configura a porta serial com o baud rate especificado
    const arduino = new serialport.SerialPort(
        {
            path: portaArduino.path,
            baudRate: SERIAL_BAUD_RATE
        }
    );

    


    //COMEÇO DA PARTE 3

    // evento quando a porta serial é aberta
    arduino.on('open', () => {
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
    });


    // PARTE 4 INICIO

    // processa os dados recebidos do Arduino
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        console.log(data);
        const valores = data.split(';');
        //const sensorDigital = parseInt(valores[0]);
        const sensorPpm = parseInt(valores[0]);

        // armazena os valores dos sensores nos arrays correspondentes
        valoresSensorAnalogico.push(sensorPpm);
        //valoresSensorDigital.push(sensorDigital);


        // insere os dados no banco de dados (se habilitado)
        if (HABILITAR_OPERACAO_INSERIR) {
            
            //Parte 5 – Inserindo no banco de dados

            // este insert irá inserir os dados na tabela "medida"
            await poolBancoDados.execute(
                'INSERT INTO leitura (valorPPM , fkSensor) VALUES (?, 1)',
                [sensorPpm]
            );
            await poolBancoDados.execute(
                'INSERT INTO leitura (valorPPM , fkSensor) VALUES (?, 2)',
                [sensorPpm - 10]
            );
            await poolBancoDados.execute(
                'INSERT INTO leitura (valorPPM , fkSensor) VALUES (?, 3)',
                [sensorPpm + 30]
            );
            await poolBancoDados.execute(
                'INSERT INTO leitura (valorPPM , fkSensor) VALUES (?, 4)',
                [sensorPpm - 15]
            );
            console.log("valores inseridos no banco: ", sensorPpm);

        }

    });

    // evento para lidar com erros na comunicação serial
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
    });
}


// PARTE 6


// Aqui o código está criando um servidor web usando o Express, uma biblioteca do Node.js.
// Esse “servidor” é o que permite que outros sistemas (como o site) acessem os dados coletados pelo Arduino.

const servidor = (
    valoresSensorAnalogico,
    //valoresSensorDigital
) => {
    const app = express();

    // Essa parte é uma configuração de segurança e acesso.
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
    });

    // inicia o servidor na porta especificada
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });

    // define os endpoints da API para cada tipo de sensor
    app.get('/sensores/analogico', (_, response) => {
        return response.json(valoresSensorAnalogico);
    });
    /*app.get('/sensores/digital', (_, response) => {
        return response.json(valoresSensorDigital);
    });
    */
}

// função principal assíncrona para iniciar a comunicação serial e o servidor web
(async () => {
    // arrays para armazenar os valores dos sensores
    const valoresSensorAnalogico = [];
    //const valoresSensorDigital = [];

    // inicia a comunicação serial
    await serial(
        valoresSensorAnalogico,
        //valoresSensorDigital
    );

    // inicia o servidor web
    servidor(
        valoresSensorAnalogico,
        //valoresSensorDigital
    );  
})();