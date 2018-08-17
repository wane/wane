// @ts-ignore
import { Template, Register } from 'wane'
import Button from './components/Button'
import Loader from './components/Loader'

@Register(Button, Loader)
@Template(`
  <div>Test</div>
  <Button [content]="'Test'"/>
  <Button [content]="'Test'" [isLoading]="true"/>
`)
export default class {

}
