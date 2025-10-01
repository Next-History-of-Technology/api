// Bloco 1
const int PINO_SENSOR_MQ2 = A0;



// Bloco 2
void setup() {
  Serial.begin(9600);
}



// Bloco 3

void loop() {
  int valorSensor = analogRead(PINO_SENSOR_MQ2);

  float ppm = ((float)(valorSensor));

  Serial.print(ppm);
  Serial.println(';');
  



  delay(2000);
}
