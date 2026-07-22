def outer(value):
    def inner():
        return value
    return value

