<template>
<q-page class="column align-start items-center">

  <q-card class="bs q-mt-md petitelargeur fs-md column justify-center">
    <div :class="'q-mt-sm q-pb-md q-gutter-md row justify-center full-width bord' + (!session.mode ? '1' : '2')">
      <q-radio dense v-model="session.mode" :val="1" :label="$t('sync')" />
      <q-radio dense v-model="session.mode" :val="2" :label="$t('incognito')" />
      <q-radio dense v-model="session.mode" :val="3" :label="$t('avion')" />
    </div>

    <div :class="'full-width q-pa-sm ' + (!session.mode ? 'disabled' : '')">
      <phrase-secrete label-valider="LOGconn" icon-valider="send" v-on:ok-ps="onps"></phrase-secrete>
      <div :class="!session.synchro ? 'disabled' : ''">
        <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
          class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
          class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
      </div>
    </div>

    <q-separator class="q-my-md"/>

    <div :class="'full-width q-pa-sm column items-start' + (!session.accesNet ? ' disabled' : '')">
      <div class="titre-md">{{$t('LOGpar')}}</div>
      <q-btn v-if="!btncd" flat dense color="warning" icon="add_circle" :label="$t('LOGcrea')" @click="btncd = true"/>
      <div v-else class="full-width">
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
      </div>
    </div>
  </q-card>

  <q-dialog v-model="dialcp" persistent full-height>
    <AcceptationSponsoring :sp="sp" :pc="pc" :close="fermerap" />
  </q-dialog>

</q-page>
</template>

<script>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { $t, afficherDiag } from '../app/util.mjs'
import { connecterCompte } from '../app/connexion.mjs'
import { PhraseContact, Sponsoring } from '../app/modele.mjs'
import { ChercherSponsoring } from '../app/operations.mjs'
import { AMJ } from '../app/api.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import AcceptationSponsoring from '../dialogues/AcceptationSponsoring.vue'

export default {
  name: 'PageLogin',

  components: { PhraseSecrete, AcceptationSponsoring },

  data () {
    return {
      btncd: false,
      phrase: '',
      isPwd: false,
      encours: false,
      dialcp: false,
      phch: 0,
      datactc: null,
      coupleloc: null,
      /* clex: null, pph: 0, p: null */
    }
  },

  methods: {
    onps (phrase) {
      connecterCompte(phrase, this.razdb)
    },
    crypterphrase () {
      if (!this.phrase) return
      this.encours = true
      setTimeout(async () => {
        try {
          this.pc = await new PhraseContact().init(this.phrase)
          this.encours = false
          /* Recherche sponsoring ******
          args.ids : hash de la phrase de contact
          Retour:
          - rowSponsoring s'il existe
          */
          const res = await new ChercherSponsoring().run(this.pc.phch)
          if (!res || !res.rowSponsoring) {
            await afficherDiag(this.$t('LOGnopp'))
            this.raz()
            return
          }
          try {
            this.sp = await Sponsoring.fromRow(res.rowSponsoring, this.pc.clex)
            if (this.sp.dlv <  AMJ.amjUtc()) {
              await afficherDiag(this.$t('LOGppinv'))
              this.raz()
              return                  
            }
            if (this.sp.st !== 0) {
              await afficherDiag(this.$t('LOGsp' + this.sp.st))
              this.raz()
              return                  
            }
            this.dialcp = true
            this.raz()
            return
          } catch (e) {
            await afficherDiag(this.$t('LOGppatt'))
            this.raz()
            return         
          }
        } catch (e) {
          console.log(e)
          this.raz()
          return
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
      config,
      razdb
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 0 !important
.bord1
  border-radius: 6px
  border: 2px solid $warning !important
.bord2
  border: 2px solid transparent !important
</style>
