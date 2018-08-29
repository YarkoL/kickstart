import React, { Component } from 'react';
import Layout from '../../components/Layout';
import { Button, Form, Input, Message } from 'semantic-ui-react'
import factory from '../../ethcode/factory'
import web3 from '../../ethcode/web3'

class CampaignNew extends Component {
	state = {
		minimumContribution: '',
		errorMsg: '',
		loading: false
	};

	onSubmit = async (event) => {
		event.preventDefault();
		this.setState({loading:true, errorMsg: ''});
		try {
			const accounts = await web3.eth.getAccounts();
			await factory.methods
			.createCampaign(this.state.minimumContribution)
			.send({
				from: accounts[0]
			});	
		} catch(err) {
			this.setState({errorMsg:err.message});
		}
		this.setState({loading:false});
	};

	render() {
		return (
			<Layout>
				<h3>Create a campaign</h3>
				<Form 
					onSubmit={this.onSubmit} 
					error={!!this.state.errorMsg}
				>
					<Form.Field>
						<label>Minimum contribution</label>
						<Input 
							label="Wei" 
							labelPosition="right"
							value = {this.state.minimumContribution}
							onChange = {
								event => this.setState({
									minimumContribution: event.target.value
								})
							}
						>
						</Input>
					</Form.Field>
					<Message error header="Oops!" 
						content={this.state.errorMsg}/>
					<Button primary loading={this.state.loading}type='submit'>Create!</Button>
				</Form>
				
			</Layout>
		); 
	}
}

export default CampaignNew;