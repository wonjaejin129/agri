CREATE TABLE IF NOT EXISTS market_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prdlstNm VARCHAR(255),
  spciesNm VARCHAR(255),
  grade VARCHAR(50),
  stndrd VARCHAR(100),
  auctPrice INT,
  auctDe DATE
);
