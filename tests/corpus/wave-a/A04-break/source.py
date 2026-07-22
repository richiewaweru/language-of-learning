def contains_value(values, target):
    found = False
    for value in values:
        if value == target:
            found = True
            break
    return found

