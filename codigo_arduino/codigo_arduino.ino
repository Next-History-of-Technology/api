const int PINO_SENSOR_MQ2 = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int valorSensor = analogRead(PINO_SENSOR_MQ2);

  float ppm = ((float)(valorSensor));

  Serial.print(ppm);
  Serial.println(';');

  delay(2000);
}
