class ServiceError(Exception):
    """Base class for service-layer exceptions."""
    pass


class ValidationFailed(ServiceError):
    def __init__(self, message="Validation failed", details=None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class PermissionDenied(ServiceError):
    def __init__(self, message="Permission denied"):
        super().__init__(message)
        self.message = message


class InvalidTransition(ServiceError):
    def __init__(self, message="Invalid state transition", details=None):
        super().__init__(message)
        self.message = message
        self.details = details or {}
