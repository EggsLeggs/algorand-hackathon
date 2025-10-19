import logging

import algokit_utils

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy() -> None:
    from smart_contracts.artifacts.ticketing_app.ticketing_app_client import (
        HelloArgs,
        TicketingAppFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        TicketingAppFactory, default_sender=deployer_.address
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer_.address,
                receiver=app_client.app_address,
            )
        )

    # Test the hello function
    name = "world"
    response = app_client.send.hello(args=HelloArgs(name=name))
    logger.info(
        f"Called hello on {app_client.app_name} ({app_client.app_id}) "
        f"with name={name}, received: {response.abi_return}"
    )
    
    # Test the bootstrap function
    from smart_contracts.artifacts.ticketing_app.ticketing_app_client import BootstrapArgs
    
    asset_id = 123456  # Example ASA ID
    price = 1000000  # 1 ALGO in microALGOs
    start = 1704067200  # Unix timestamp for Jan 1, 2024
    end = 1706745600  # Unix timestamp for Feb 1, 2024
    per_wallet_cap = 5  # Max 5 tickets per wallet
    
    bootstrap_response = app_client.send.bootstrap(
        args=BootstrapArgs(
            asset_id=asset_id,
            price=price,
            start=start,
            end=end,
            per_wallet_cap=per_wallet_cap,
            organizer=deployer_.address,
        )
    )
    
    logger.info(
        f"Bootstrapped ticket sale with ASA ID: {asset_id}"
    )
