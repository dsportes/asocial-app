<template>
<q-page class="column align-start items-center">
  <q-card flat class="q-ma-xs petitelargeur fs-md column justify-center">
    <q-card-section>
      <div class="row justify-between items-center">
        <bouton-help page="page3"/>
        <div class="titre-xl">{{$t('bonjour')}}</div>
        <choix-langue style="position:relative;top:-5px"/>
      </div>
    </q-card-section>
    <q-card-section>
      <div v-if="session.reseau" class="q-gutter-md row justify-center">
        <span class="titre-md">{{$t('reseau',[session.reseau])}}</span>
        <q-btn v-if="session.reseau" color="primary" :label="$t('LOGchr')" size="sm" dense @click="session.resetReseau()"/>
      </div>
      <div v-else>
        <q-separator/>
          <choix-reseau/>
        <q-separator/>
      </div>
    </q-card-section>
    <q-card-section v-if="!q666">
      <div class="q-gutter-md row justify-center">
        <q-radio dense v-model="session.mode" :val="1" :label="$t('sync')" />
        <q-radio dense v-model="session.mode" :val="2" :label="$t('incognito')" />
        <q-radio dense v-model="session.mode" :val="3" :label="$t('avion')" />
        <bouton-help class="q-ml-lg" page="page1"/>
      </div>  

      <div v-if="session.mode">
        <phrase-secrete label-valider="LOGconn" icon-valider="send" v-on:ok-ps="onps"></phrase-secrete>
        <div v-if="session.accesIdb">
          <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
            class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
          <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
            class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        </div>
      </div>
    </q-card-section>
  </q-card>

  <q-card v-if="!q666 && (session.accesNet)" class="q-mt-lg petitelargeur column items-start">
    <div class="titre-md">{{$t('LOGpar')}}</div>
    <q-btn v-if="!creationDemandee" flat color="warning" icon="add_circle" :label="$t('LOGcrea')" @click="btncd=true"/>
    <div v-else>
      <q-card-section class="petitelargeur">
        <q-input class="full-width" dense v-model="phrase" :label="$t('LOGphr')"
          @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
          :hint="$t('entree')">
          <template v-slot:append>
            <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
            <span :class="phrase.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="phrase=''"/></span>
            <q-btn dense icon-right="send" size="sm" color="warning" :label="$t('OK')" @click="crypterphrase"/>
          </template>
        </q-input>
        <div v-if="encours" class="fs-md text-italic text-primary">{{$t('cryptage')}}
          <q-spinner color="primary" size="2rem" :thickness="3" />
        </div>
      </q-card-section>
    </div>
  </q-card>

  <q-dialog v-model="dialcp">
    <AcceptParrain :couple="coupleloc" :datactc="datactc" :clepubc="clepubc" :phch="phch" :close="fermerap" />
  </q-dialog>

  <q-card v-if="q666 && session.reseau" class="q-ma-xs moyennelargeur fs-md">
    <q-card-section class="column items-center">
      <div class="titre-lg text-center">{{$t('LOGcc')}}</div>
    </q-card-section>

    <q-card-section>
      <phrase-secrete class="q-ma-xs" :init-val="phrase" v-on:ok-ps="creercc"
        icon-valider="check" label-valider="creer"></phrase-secrete>
    </q-card-section>
  </q-card>

</q-page>
</template>

<script>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { $t, afficherDiag, dlvDepassee, tru8 } from '../app/util.mjs'
import { connecterCompte, CreationCompteComptable } from '../app/connexion.mjs'
import { PhraseContact, Contact, NomContact, Couple } from '../app/modele.mjs'
import { get } from '../app/net.mjs'
import { deserial } from '../app/schemas.mjs'

import ChoixLangue from '../components/ChoixLangue.vue'
import ChoixReseau from '../components/ChoixReseau.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import AcceptParrain from '../dialogues/AcceptParrain.vue'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Login',

  components: { ChoixLangue, ChoixReseau, BoutonHelp, PhraseSecrete, AcceptParrain },

  computed: {
    creationDemandee () { 
      return this.btncd === true 
    }
  },

  data () {
    return {
      btncd: 'false',
      phrase: null,
      isPwd: false,
      encours: false,
      dialcp: false,
      phch: 0,
      clepubc: null,
      datactc: null,
      coupleloc: null,
      /* clex: null, pph: 0, p: null */
    }
  },

  methods: {
    async onps (phrase) {
      await connecterCompte(phrase, this.razdb)
    },
    crypterphrase () {
      if (!this.phrase) return
      this.encours = true
      setTimeout(async () => {
        const pc = await new PhraseContact().init(this.phrase)
        this.phch = pc.phch
        this.encours = false
        const resp = await get('m1', 'getContact', { phch: pc.phch })
        if (!resp || !resp.length) {
          await afficherDiag(this.$t('LOGnopp'))
          this.raz()
        } else {
          try {
            const [row, clepubc] = deserial(new Uint8Array(resp))
            this.clepubc = clepubc
            const contact = await new Contact().fromRow(row)
            tru8('Login ph parr clepubc ' + contact.id, clepubc)
            if (dlvDepassee(contact.dlv)) {
              await afficherDiag(this.$t('LOGppinv'))
              this.raz()
              return
            }
            this.datactc = await contact.getData(pc.clex)
            // { cc, nom, nct, parrain, forfaits, idt }
            const naf = new NomContact('fake', this.datactc.cc)
            const resp2 = await get('m1', 'getCouple', { id: naf.id })
            if (!resp2) {
              await afficherDiag(this.$t('LOGppatt'))
              this.raz()
              return
            }
            const row2 = deserial(new Uint8Array(resp2))
            this.coupleloc = await new Couple().fromRow(row2, this.datactc.cc)
            this.raz()
            this.dialcp = true
          } catch (e) {
            console.log(e)
            this.raz()
          }
        }
      }, 1)
    },
    raz () {
      this.btncd = false
      this.phrase = ''
    },
    fermerap () {
      this.dialcp = false
      this.btncd = false
    },
    async creercc (ps) {
      if (!ps) return
      this.phrase = null
      await new CreationCompteComptable().run(ps)
    }
  },

  setup () {
    const config = stores.config
    const session = stores.session

    const razdb = ref(false)

    watch(razdb, async (ap, av) => {
      if (ap === true && ap !== av) {
        await afficherDiag($t('LOGrazbl'))
        console.log('Raz db diag')
      }
    })

    return {
      session,
      q666: config.search === '666',
      config,
      razdb
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 0.3rem !important
</style>
