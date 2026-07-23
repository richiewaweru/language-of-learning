def count_passing(scores):
    total = 0
    for score in scores:
        if score >= 50:
            total = total + 1
    return total

result = count_passing([50, 49, 100])
