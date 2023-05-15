<template>
<q-page class="column align-start items-center">

  <q-card class="q-mt-lg petitelargeur fs-md column justify-center">
    <div :class="'full-width bord' + (!session.mode ? '1' : '2')">
    <div class="q-py-sm q-gutter-md row justify-center">
      <q-radio dense v-model="session.mode" :val="1" :label="$t('sync')" />
      <q-radio dense v-model="session.mode" :val="2" :label="$t('incognito')" />
      <q-radio dense v-model="session.mode" :val="3" :label="$t('avion')" />
    </div>
    </div>
  </q-card>

  <q-card v-if="session.mode" class="q-mt-lg q-pa-sm petitelargeur fs-md column justify-center">
      <phrase-secrete label-valider="LOGconn" icon-valider="send" @ok="onps"></phrase-secrete>
      <div :class="!session.synchro ? 'disabled' : ''">
        <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
          class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
          class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
      </div>
  </q-card>

  <q-card v-if="session.accesNet" class="q-mt-lg q-pa-sm petitelargeur fs-md column justify-center">
      <div class="titre-md">{{$t('LOGpar')}}</div>
      <q-btn v-if="!btncd" flat dense color="warning" icon="add_circle" :label="$t('LOGcrea')" @click="btncd = true"/>
      <div v-else class="full-width">
        <phrase-contact @ok="crypterphrase"/>
      </div>
  </q-card>

  <q-dialog v-model="dialcp" persistent full-height>
    <AcceptationSponsoring :sp="sp" :pc="pc"/>
  </q-dialog>

</q-page>
</template>

<script>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { $t, afficherDiag } from '../app/util.mjs'
import { connecterCompte } from '../app/connexion.mjs'
import { MD, Sponsoring } from '../app/modele.mjs'
import { ChercherSponsoring } from '../app/operations.mjs'
import { AMJ } from '../app/api.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import PhraseContact from '../components/PhraseContact.vue'
import AcceptationSponsoring from '../dialogues/AcceptationSponsoring.vue'

export default {
  name: 'PageLogin',

  components: { PhraseContact, PhraseSecrete, AcceptationSponsoring },

  data () {
    return {
      btncd: false,
      datactc: null,
      coupleloc: null,
      pc: null
    }
  },

  methods: {
    onps (phrase) {
      connecterCompte(phrase, this.razdb)
    },
    async crypterphrase (pc) {
      this.pc = pc
      try {
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
          this.ovdialcp()
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
    },
    raz () {
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

    const dialcp = ref(false)
    function ovdialcp () { MD.oD(dialcp) }

    return {
      MD, dialcp, ovdialcp,
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
