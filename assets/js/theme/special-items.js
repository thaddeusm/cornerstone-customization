import PageManager from "./page-manager";

export default class SpecialItems extends PageManager  {
    constructor(context) {
        super(context);

        // create line items array with special items
    	this.lineItems = [];
    	this.ids = [];

    	for (let i=0; i<this.context.products.length; i++) {
    		let product = this.context.products[i];

    		this.lineItems.push({
    			"quantity": 1,
    			"product_id": product.id,
    			"gift_certificates": {}
    		});

    		this.ids.push(product.id);
    	}

        return this;
    }

    updateCartQuantity(existingItems, quantityChange) {
    	if (existingItems) {
    		// sum existing items
    		let existingQuantity = 0;

    		for (let i=0; i<existingItems.length; i++) {
    			existingQuantity += existingItems[i].quantity;
    		}

    		$('body').trigger('cart-quantity-update', existingQuantity += quantityChange);
    	} 
    }

    registerRemoveAllItemsListener() {
    	$('#removeAll').on('click', (event) => {
    		this.removeAllItems();
    	});
    }

    removeAllItems() {
    	$('#removeAll').text('Removing items...').attr('disabled', 'true');

    	let promises = [];

    	// check current cart
    	fetch('/api/storefront/cart', {
		 	credentials: 'include'
		}).then(response => {
			return response.json();
		}).then(existingCart => {
			let existingItems = existingCart[0].lineItems.physicalItems;

			let numberRemoved = 0;

			for (let i=0; i<existingItems.length; i++) {
    			let id = existingItems[i].id;

    			let product = existingItems[i].productId;

    			let productIndex = this.ids.indexOf(product);

    			if (productIndex !== -1) {
    				let req = fetch('/api/storefront/carts/' + existingCart[0].id + '/items/' + id, {
			       		method: "DELETE",
			       		credentials: "same-origin",
			       		headers: {
			           	"Content-Type": "application/json",}
					}).then(msg => {
						numberRemoved += existingItems[i].quantity;
					});
					
					promises.push(req);
    			}
			}

            setTimeout(function() {
                $('#removeAll').css('display', 'none').attr('disabled', false).text('Remove All Items');
            }, 2000);

			Promise.all(promises).then(() => {
				this.updateCartQuantity(existingCart[0].lineItems.physicalItems, 0 - numberRemoved);
			})
		});
    }

    registerAddAllToCartListener() {
    	$('#addAll').on('click', (event) => {
    		this.addAllItems();
    	});
    }

    addAllItems() {
    	// check current cart
    	fetch('/api/storefront/cart', {
		 	credentials: 'include'
		}).then(response => {
			return response.json();
		}).then(existingCart => {
			if (existingCart.length > 0) {
				// add items to existing cart
				fetch('/api/storefront/carts/' + existingCart[0].id + '/items', {
					method: "POST",
					credentials: "same-origin",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({"lineItems": this.lineItems}),
				})
				.then(response => response.json());

				this.updateCartQuantity(existingCart[0].lineItems.physicalItems, this.lineItems.length);
			} else {
				// create a new cart with items
				fetch('/api/storefront/carts', {
					method: "POST",
					credentials: "same-origin",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({"lineItems": this.lineItems}),
				})
				.then(response => response.json());

				this.updateCartQuantity(null, this.lineItems.length);
			}

			$('#addAll').text('Items added!');
			$('#removeAll').css('display', 'inline');

			setTimeout(function() {
				$('#addAll').text('Add All to Cart');
			}, 2000);
		});
    }

    registerHoverEventListeners() {
    	// change image on hover

        // when product grid is displayed
        $('.card-figure').on('mouseover', event => {
        	$('.card-img-container .card-image:nth-child(2)').css('display', 'none');
        });

        $('.card-figure').on('mouseout', event => {
        	$('.card-img-container .card-image:nth-child(2)').css('display', 'block');
        });

        // when product list is displayed
        $('.listItem-figure .listItem-image:first-child').css('display', 'none');

        $('.listItem-figure').on('mouseover', event => {
        	$('.listItem-figure .listItem-image:nth-child(2)').css('display', 'none');
        	$('.listItem-figure .listItem-image:first-child').css('display', 'block');
        });

        $('.listItem-figure').on('mouseout', event => {
        	$('.listItem-figure .listItem-image:nth-child(2)').css('display', 'block');
        	$('.listItem-figure .listItem-image:first-child').css('display', 'none');
        });
    }

    onReady(){
        this.registerHoverEventListeners();
        this.registerAddAllToCartListener();
        this.registerRemoveAllItemsListener();
    }
}