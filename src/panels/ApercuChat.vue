<template>
  <q-layout container view="hHh lpR fFf" :class="styp('md')" style="max-height:90vh">
    <q-header elevated>
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{!zombi ? $t('CHoch3', [nomI, nomE]) : $t('CHzombi')}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div v-if="!zombi">
        <div v-if="chatX.stE===0" class="text-warning text-bold bg-yellow-5">
              {{$t('CHraccroche2', [session.getCV(chatX.idE).nom])}}</div>
        <div v-if="chatX.stI===0" class="text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</div>
        <div v-if="chatX.stE === 2" class="text-center full-width bg-yellow-5 titre-lg text-bold text-negative q-paxs">
          {{$t('disparu')}}</div>
        <apercu-genx v-else class="bordb" :id="chatX.idE" :idx="0" />
        <div :class="sty() + 'q-pa-xs row justify-around items-center'">
          <div v-if="chatX.stE !== 2" class="row q-gutter-xs items-center">
            <btn-cond :label="$t('CHadd1')" icon="add" @ok="editer(false)"
              :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
            <btn-cond :label="$t('CHadd2')" icon="savings"
              @ok="editer(true)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          </div>
          <btn-cond v-if="chatX.stI" 
            :label="$t('CHrac')" icon="phone_disabled" @ok="raccrocher()"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <div v-if="!chatX.stI" class="text-warning text-bold titre-md text-italic">
            {{$t('CHraccroche')}}
          </div>
        </div>
      </div>
    </q-header>

    <q-page-container>
      <q-card  v-if="!zombi" class="q-pa-sm">
        <div v-for="it in chatX.items" :key="it.dh + '/' + it.a">
          <q-chat-message :sent="it.a===0" 
            :bg-color="it.a ? 'brown-10' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-blanc v-if="!it.dhx" :texte="it.t"/>
            <div v-else class="text-italic bg-yellow-3 text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{it.a===0 ? $t('moi') : nomE}}</span>
                <btn-cond v-if="it.a===0 && !it.dhx" size="sm" icon="clear" color="secondary"
                  @ok="effacer(it.dh)" 
                  :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d[idc].ACconfirmeff">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHeffcf')" @ok="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="ui.d[idc].ACconfirmrac">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [nomE])}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="clear"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHrac')" @ok="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d[idc].ACchatedit">
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-toolbar v-if="avecDon" inset class="bg-secondary text-white">
          <q-toolbar-title class="row justify-center items-center q-gutter-md">
            <div class="titre-md text-bold">{{$t('CHmdon')}}</div>
            <q-select :options="cfg.dons2" size="md" v-model="mdon" dense color="white"/>
            <q-checkbox class="titre-md text-bold" size="md" dense 
              left-label v-model="dconf" :label="$t('CHcdon')" />
          </q-toolbar-title>
        </q-toolbar>
        <div v-if="avecDon && (mdon + 2 > solde)" class="msg text-bold">{{$t('CHcred', [solde, mdon])}}</div>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="add" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('valider')"
            :disable="avecDon && mdon > solde + 2"
            @ok="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const $t = useI18n().t

  import { ref, computed, onUnmounted } from 'vue'

  import stores from '../stores/stores.mjs'

  import { styp, sty, dhcool, dkli, afficherDiag, $q } from '../app/util.mjs'
  import { GetCompta, MajChat, PassifChat } from '../app/operations4.mjs'
  import { ID } from '../app/api.mjs'

  import SdBlanc from '../components/SdBlanc.vue'
  import EditeurMd from '../components/EditeurMd.vue'
  import ApercuGenx from '../components/ApercuGenx.vue'
  import BoutonHelp from '../components/BoutonHelp.vue'
  import BtnCond from '../components/BtnCond.vue'

  const props = defineProps({ 
    id: String, 
    ids: String,
    urgence: Boolean
  })

  const ui = stores.ui
  const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
  const aSt = stores.avatar
  const session = stores.session
  const cfg = stores.config
  const pSt = stores.people

  const chatX = computed(() => aSt.getChat(props.id, props.ids))
  const zombi = computed(() => !chatX.value )
  const nomE = computed(() => chatX.value ? session.getCV(chatX.value.idE).nom : '')
  const nomI = computed(() => chatX.value ? session.getCV(chatX.value.id).nom : '')
  const estDel = computed(() => ID.estComptable(chatX.value.idE) || session.estDelegue)

  const dconf = ref(false)
  const txt = ref('')
  const avecDon = ref(false)
  const mdon = ref(cfg.dons2[0])
  const dheff = ref(0)
  const solde = ref(0)

  async function effacer (dh) {
    dheff.value = dh
    nbci.value--
    ui.oD('ACconfirmeff', idc)
  }

  async function effop () {
    ui.fD()
    const disp = await new MajChat().run(chatX.value, null, dheff.value)
    if (disp) { await afficherDiag(this.$t('CHdisp')) }
    dheff.value = 0
  }

  async function addop () {
    ui.fD()
    /*
    if (avecDon.value && mdon.value) {
      await new GetCompta().run()
      const compta = session.compta
      if (mdon.value > compta.solde + 2) {
        await afficherDiag($t('CHcred', [compta.solde, mdon.value * 100]))
        return
      }
    }
    */
    const don = avecDon.value ? mdon.value : 0
    const t = (avecDon.value && !dconf.value ? ($t('CHdonde', [mdon.value]) + '\n') : '') + txt.value
    const disp = await new MajChat().run(chatX.value, t, 0, don, props.urgence)
    if (disp) { await afficherDiag($t('CHdisp')) }
    txt.value = ''
  }

  async function passifop () {
    ui.fD()
    const suppr = await new PassifChat().run(chatX.value)
    if (suppr) { await afficherDiag($t('CHsuppr')) }
  }

  async function editer (avecD) {
    if (avecD) { 
      dconf.value = false
      await session.reloadCompta()
      solde.value = session.compta.compteurs.soldeCourant
    }
    txt.value = chatX.value ? chatX.value.txt : ''
    avecDon.value = avecD
    ui.oD('ACchatedit', idc)
  }

  async function raccrocher () {
    txt.value = ''
    ui.oD('ACconfirmrac', idc)
  }

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
