def classify_temperature(temp):
    if temp > 30:
        return "hot"
    else:
        return "cool"

result = classify_temperature(30)
