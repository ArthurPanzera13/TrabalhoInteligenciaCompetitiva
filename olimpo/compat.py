import inspect


def patch_pytrends_retry_compat() -> None:
    """
    Compatibilidade entre pytrends 4.9.2 e urllib3>=2.
    pytrends usa o parâmetro removido `method_whitelist`; em urllib3 novo
    o nome correto é `allowed_methods`.
    """
    try:
        from urllib3.util.retry import Retry
    except Exception:
        return

    params = inspect.signature(Retry.__init__).parameters
    if "method_whitelist" in params:
        return

    original_init = Retry.__init__

    def compat_init(self, *args, **kwargs):
        if "method_whitelist" in kwargs and "allowed_methods" not in kwargs:
            kwargs["allowed_methods"] = kwargs.pop("method_whitelist")
        return original_init(self, *args, **kwargs)

    Retry.__init__ = compat_init
