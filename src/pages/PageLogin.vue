<template>
<q-page class="column align-start items-center">

  <q-card class="q-mt-lg petitelargeur fs-md column justify-center">
    <div :class="'full-width row items-center bord' + (!session.mode ? '1' : '2')">
      <div class="col q-py-sm q-gutter-md row justify-center">
        <q-radio dense v-model="locmode" :val="1" :label="$t('sync')" />
        <q-radio dense v-model="locmode" :val="2" :label="$t('incognito')" />
        <q-radio dense v-model="locmode" :val="3" :label="$t('avion')" />
      </div>
      <bouton-help page="page1" class="colauto"/>
    </div>
  </q-card>

  <q-expansion-item v-if="session.mode" class="q-mt-lg petitelargeur"
    expand-separator icon="send" :label="$t('LOGconn2')"
    group="g1" default-opened header-class="titre-lg bg-primary text-white">
    <div class="fs-md column justify-center">
        <phrase-secrete label-valider="LOGconn" icon-valider="send" @ok="onps"/>
        <div :class="!session.synchro ? 'disabled' : ''">
          <q-checkbox v-if="$q.dark.isActive" v-model="razdb" dense size="xs" color="grey-8"
            class="bg1 text-italic text-grey-8 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
          <q-checkbox v-else v-model="razdb" dense size="xs" color="grey-5"
            class="bg1 text-italic text-grey-7 q-ml-sm q-mb-sm" :label="$t('LOGreinit')"/>
        </div>
    </div>
  </q-expansion-item>
  <q-separator/>
  <q-expansion-item v-if="session.accesNet" class="petitelargeur"
    expand-separator icon="add_circle" :label="$t('LOGconn3')"
    group="g1" header-class="titre-lg bg-primary text-white">
    <div class="fs-md column justify-center">
        <div v-if="!btncd" class="titre-md">{{$t('LOGpar')}}</div>
        <q-btn v-if="!btncd" flat dense color="warning" icon="add_circle" :label="$t('LOGcrea')" @click="btncd = true"/>
        <div v-if="btncd" class="full-width">
          <phrase-contact @ok="crypterphrase"/>
        </div>
    </div>
  </q-expansion-item>

  <q-dialog v-model="dialcp" persistent full-height>
    <AcceptationSponsoring :sp="sp" :pc="pc" :org="org"/>
  </q-dialog>

</q-page>
</template>

<script>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { $t, afficherDiag } from '../app/util.mjs'
import { connecterCompte } from '../app/connexion.mjs'
import { MD, Sponsoring, resetRepertoire } from '../app/modele.mjs'
import { ChercherSponsoring } from '../app/operations.mjs'
import { AMJ, ID } from '../app/api.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import PhraseContact from '../components/PhraseContact.vue'
import AcceptationSponsoring from '../dialogues/AcceptationSponsoring.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  name: 'PageLogin',

  components: { PhraseContact, PhraseSecrete, AcceptationSponsoring, BoutonHelp },

  data () {
    return {
      btncd: false,
      datactc: null,
      coupleloc: null,
      pc: null,
      org: ''
    }
  },

  methods: {
    onps (phrase) {
      connecterCompte(phrase, this.razdb)
    },
    async crypterphrase (pc) {
      this.pc = pc
      this.org = pc.org
      try {
        /* Recherche sponsoring ******
        args.ids : hash de la phrase de contact
        Retour:
        - rowSponsoring s'il existe
        */
        resetRepertoire()
        stores.reset()
        const res = await new ChercherSponsoring().run(this.pc.phch)
        if (!res || !res.rowSponsoring) {
          await afficherDiag(this.$t('LOGnopp'))
          this.raz()
          return
        }
        try {
          const sp = res.rowSponsoring
          const session = stores.session
          session.setNs(ID.ns(sp.id))
          this.sp = await Sponsoring.fromRow(sp, this.pc.clex)
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
    const locmode = ref(session.mode)
    const razdb = ref(false)

    watch(razdb, async (ap, av) => {
      if (ap === true && ap !== av) {
        await afficherDiag($t('LOGrazbl'))
        console.log('Raz db diag')
      }
    })

    watch(locmode, (ap, av) => {
      if (ap !== session.mode) {
        session.setMode(ap)
      }
    })

    const dialcp = ref(false)
    function ovdialcp () { MD.oD(dialcp) }

    return {
      MD, dialcp, ovdialcp,
      session,
      config,
      razdb,
      locmode
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
